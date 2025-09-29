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
      const url = `${this.registryUrl}/registry.json`;
      const response = await axios.get(url);
      return response.data;
    });
  }

  async searchAgents(query: string = '', filters: SearchFilters = {}): Promise<AgentInfo[]> {
    const registry = await this.getRegistry();
    let agents = Object.values(registry.agents);

    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      agents = agents.filter(agent => 
        agent.name.en.toLowerCase().includes(lowerQuery) ||
        agent.name.zh.toLowerCase().includes(lowerQuery) ||
        agent.description.en.toLowerCase().includes(lowerQuery) ||
        agent.description.zh.toLowerCase().includes(lowerQuery) ||
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

  async getAgentDetails(agentId: string): Promise<AgentInfo | null> {
    const registry = await this.getRegistry();
    return registry.agents[agentId] || null;
  }

  async downloadAgent(agentId: string, version?: string): Promise<string> {
    const agent = await this.getAgentDetails(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const targetVersion = version || agent.latest;
    const url = `${this.registryUrl}/agents/${agent.author}/${agentId}/agent.md`;
    
    const response = await axios.get(url);
    return response.data;
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

