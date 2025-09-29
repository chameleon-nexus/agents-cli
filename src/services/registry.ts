import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { Registry, AgentInfo, SearchFilters } from '../types';

export class RegistryService {
  private static readonly DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  constructor(private registryUrl?: string) {
    this.registryUrl = registryUrl || RegistryService.DEFAULT_REGISTRY_URL;
  }

  async getRegistry(): Promise<Registry> {
    return this.fetchWithCache('registry', async () => {
      const url = `${this.registryUrl}/index/main.json`;
      const response = await axios.get(url);
      return response.data;
    });
  }

  async searchAgents(query: string = '', filters: SearchFilters = {}): Promise<AgentInfo[]> {
    let agents: AgentInfo[] = [];

    if (filters.category) {
      // Fetch specific category
      agents = await this.getCategoryAgents(filters.category);
    } else {
      // Fetch featured agents or all categories
      agents = await this.getAllAgents();
    }

    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      agents = agents.filter(agent => 
        agent.name.en.toLowerCase().includes(lowerQuery) ||
        agent.name.zh.toLowerCase().includes(lowerQuery) ||
        agent.name.ja.toLowerCase().includes(lowerQuery) ||
        agent.description.en.toLowerCase().includes(lowerQuery) ||
        agent.description.zh.toLowerCase().includes(lowerQuery) ||
        agent.description.ja.toLowerCase().includes(lowerQuery) ||
        agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters.category) {
      agents = agents.filter(agent => agent.category === filters.category);
    }

    if (filters.tag) {
      agents = agents.filter(agent => 
        agent.tags.some(tag => tag.toLowerCase().includes(filters.tag!.toLowerCase()))
      );
    }

    if (filters.author) {
      agents = agents.filter(agent => 
        agent.author.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }

    if (filters.compatibility) {
      agents = agents.filter(agent => {
        const compat = agent.compatibility;
        switch (filters.compatibility) {
          case 'claudeCode':
            return compat.claudeCode || compat['claude-code' as keyof typeof compat];
          case 'codex':
            return compat.codex;
          case 'copilot':
            return compat.copilot;
          default:
            return true;
        }
      });
    }

    // Language filter - only show agents with content in specified language
    if (filters.language) {
      agents = agents.filter(agent => {
        return this.hasLanguageContent(agent, filters.language!);
      });
    }

    // Sort results
    if (filters.sortBy) {
      agents.sort((a, b) => {
        switch (filters.sortBy) {
          case 'downloads':
            return b.downloads - a.downloads;
          case 'rating':
            return b.rating - a.rating;
          case 'name':
            return a.name.en.localeCompare(b.name.en);
          case 'updated':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          default:
            return 0;
        }
      });
    }

    // Apply limit
    if (filters.limit && filters.limit > 0) {
      agents = agents.slice(0, filters.limit);
    }

    return agents;
  }

  /**
   * Check if agent has content in specified language
   */
  private hasLanguageContent(agent: any, language: string): boolean {
    // Check name field
    if (this.hasLocalizedField(agent.name, language)) {
      return true;
    }
    
    // Check description field
    if (this.hasLocalizedField(agent.description, language)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a field has content in specified language
   */
  private hasLocalizedField(field: any, language: string): boolean {
    if (!field) return false;
    
    // If field is a string, consider it as default language content
    if (typeof field === 'string') {
      return language === 'en'; // Assume string fields are English
    }
    
    // If field is an object, check for the specific language
    if (typeof field === 'object' && field[language]) {
      const content = field[language];
      return typeof content === 'string' && content.trim().length > 0;
    }
    
    return false;
  }

  async getAgentDetails(agentId: string): Promise<AgentInfo | null> {
    // Support formats: "agent-name", "author/agent-name", "author/agent-name@version"
    const allAgents = await this.getAllAgents();
    
    // Parse agent ID and version
    const { parsedId, version } = this.parseAgentId(agentId);
    
    let targetAgent: AgentInfo | undefined;
    
    if (parsedId.includes('/')) {
      // Format: "author/agent-name[@version]"
      const [author, agentName] = parsedId.split('/');
      targetAgent = allAgents.find(agent => 
        agent.author === author && agent.id === agentName
      );
    } else {
      // Format: "agent-name[@version]" - find first match by agent name
      targetAgent = allAgents.find(agent => agent.id === parsedId);
    }
    
    return targetAgent || null;
  }

  /**
   * Parse agent ID to extract agent identifier and version
   * Examples:
   * - "code-reviewer" -> { parsedId: "code-reviewer", version: undefined }
   * - "wshobson/code-reviewer" -> { parsedId: "wshobson/code-reviewer", version: undefined }
   * - "wshobson/code-reviewer@1.0.0" -> { parsedId: "wshobson/code-reviewer", version: "1.0.0" }
   */
  private parseAgentId(agentId: string): { parsedId: string; version?: string } {
    const atIndex = agentId.lastIndexOf('@');
    
    if (atIndex > 0 && atIndex < agentId.length - 1) {
      // Has version specified
      const parsedId = agentId.substring(0, atIndex);
      const version = agentId.substring(atIndex + 1);
      return { parsedId, version };
    }
    
    // No version specified
    return { parsedId: agentId };
  }

  async downloadAgent(agentId: string, version?: string): Promise<string> {
    // Parse agent ID to extract version if specified in ID format "author/agent@version"
    const { parsedId, version: parsedVersion } = this.parseAgentId(agentId);
    
    const agent = await this.getAgentDetails(parsedId);
    if (!agent) {
      throw new Error(`Agent ${parsedId} not found`);
    }

    // Priority: explicit version parameter > parsed version from ID > agent default version
    const targetVersion = version || parsedVersion || agent.version;
    const filename = `${agent.id}_v${targetVersion}.md`;
    const url = `${this.registryUrl}/agents/${agent.author}/${agent.id}/${filename}`;
    
    const response = await axios.get(url);
    return response.data;
  }

  async getCategoryAgents(category: string): Promise<AgentInfo[]> {
    return this.fetchWithCache(`category-${category}`, async () => {
      const url = `${this.registryUrl}/index/categories/${category}.json`;
      const response = await axios.get(url);
      return response.data.agents || [];
    });
  }

  async getFeaturedAgents(): Promise<AgentInfo[]> {
    return this.fetchWithCache('featured', async () => {
      const url = `${this.registryUrl}/index/featured.json`;
      const response = await axios.get(url);
      return response.data.agents || [];
    });
  }

  async getAllAgents(): Promise<AgentInfo[]> {
    const registry = await this.getRegistry();
    const categories = Object.keys(registry.categories);
    
    // Fetch all category agents in parallel
    const categoryPromises = categories.map(category => 
      this.getCategoryAgents(category).catch(() => [])
    );
    
    const categoryResults = await Promise.all(categoryPromises);
    
    // Flatten all agents from all categories
    const allAgents = categoryResults.flat();
    
    // Remove duplicates by agent ID
    const uniqueAgents = allAgents.filter((agent, index, self) => 
      index === self.findIndex(a => a.id === agent.id)
    );
    
    return uniqueAgents;
  }

  async getCategories(): Promise<Record<string, any>> {
    const registry = await this.getRegistry();
    return registry.categories;
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheTtl) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // If we have cached data, return it even if expired
      if (cached) {
        console.warn('Using cached data due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

