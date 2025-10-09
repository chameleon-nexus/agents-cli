import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { Registry, AgentInfo, SearchFilters } from '../types';
import { ConfigService } from './config';

export class RegistryService {
  private static readonly DEFAULT_API_URL = 'https://www.agthub.org';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes
  private apiUrl: string;

  constructor(apiUrl?: string) {
    const config = ConfigService.getInstance();
    this.apiUrl = apiUrl || config.get('apiUrl') || RegistryService.DEFAULT_API_URL;
  }

  async getRegistry(): Promise<Registry> {
    // Deprecated: Use AGTHub API instead
    return {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      totalAgents: 0,
      languages: ['en', 'zh', 'ja', 'vi'],
      categories: {},
      featured: {
        count: 0,
        url: '',
        description: {
          en: 'Featured agents',
          zh: '精选代理',
          ja: '注目のエージェント'
        }
      },
      stats: {
        totalDownloads: 0,
        activeUsers: 0,
        topAgents: [],
        recentUpdates: []
      }
    };
  }

  async searchAgents(query: string = '', filters: SearchFilters = {}): Promise<AgentInfo[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (query) params.append('q', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.language) params.append('lang', filters.language);
      if (filters.sortBy) params.append('sort', filters.sortBy);
      if (filters.limit) params.append('limit', filters.limit.toString());

      // Use CLI-specific API endpoint that only returns free agents
      const url = `${this.apiUrl}/api/cli/agents/search?${params.toString()}`;
      const response = await axios.get(url);
      
      const agents = response.data.agents || [];
      
      // Transform AGTHub API response to CLI format
      return agents.map((agent: any) => this.transformAgent(agent));
    } catch (error) {
      console.error('Error fetching from AGTHub:', error);
      return [];
    }
  }

  private transformAgent(apiAgent: any): AgentInfo {
    return {
      id: apiAgent.agentId,
      name: {
        en: apiAgent.name || apiAgent.agentId,
        zh: apiAgent.name_translations?.zh || '',
        ja: apiAgent.name_translations?.ja || ''
      },
      description: {
        en: apiAgent.description || '',
        zh: apiAgent.description_translations?.zh || '',
        ja: apiAgent.description_translations?.ja || ''
      },
      author: apiAgent.author?.name || 'Unknown',
      version: apiAgent.version,
      category: apiAgent.category,
      tags: apiAgent.tags || [],
      versions: {},
      homepage: apiAgent.homepage || '',
      license: apiAgent.license || 'MIT',
      downloads: apiAgent.downloads || 0,
      rating: apiAgent.averageRating || 0,
      ratingCount: apiAgent.ratingCount || 0,
      compatibility: {
        claudeCode: {
          minVersion: '1.0.0',
          tested: ['1.0.0']
        }
      },
      createdAt: apiAgent.createdAt,
      updatedAt: apiAgent.updatedAt
    };
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
    try {
      // Parse agent ID to remove version if present
      const { parsedId } = this.parseAgentId(agentId);
      
      // Search for the specific agent
      const agents = await this.searchAgents(parsedId);
      
      // Find exact match
      const agent = agents.find(a => a.id === parsedId);
      return agent || null;
    } catch (error) {
      console.error('Error fetching agent details:', error);
      return null;
    }
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
    try {
      // Parse agent ID to extract version if specified
      const { parsedId, version: parsedVersion } = this.parseAgentId(agentId);
      
      const agent = await this.getAgentDetails(parsedId);
      if (!agent) {
        throw new Error(`Agent ${parsedId} not found`);
      }

      // Get the internal database ID
      const searchResult = await axios.get(`${this.apiUrl}/api/agents/search?q=${parsedId}`);
      const agentData = searchResult.data.agents?.find((a: any) => a.agentId === parsedId);
      
      if (!agentData) {
        throw new Error(`Agent ${parsedId} not found in AGTHub`);
      }

      // Download using AGTHub API
      const downloadUrl = `${this.apiUrl}/api/agents/${agentData.id}/download`;
      const response = await axios.get(downloadUrl);
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to download agent: ${error.message}`);
    }
  }

  async getCategoryAgents(category: string): Promise<AgentInfo[]> {
    return this.searchAgents('', { category });
  }

  async getFeaturedAgents(): Promise<AgentInfo[]> {
    // Get top rated agents
    return this.searchAgents('', { sortBy: 'rating', limit: 10 });
  }

  async getAllAgents(): Promise<AgentInfo[]> {
    return this.searchAgents('', { limit: 1000 });
  }

  async getCategories(): Promise<Record<string, any>> {
    // Return static categories for now
    return {
      'development': 'Development',
      'debugging': 'Debugging',
      'data': 'Data Analysis',
      'content': 'Content Creation',
      'business': 'Business',
      'operations': 'Operations',
      'quality': 'Quality Assurance',
      'specialized': 'Specialized'
    };
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

