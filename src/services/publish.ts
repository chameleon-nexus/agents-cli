import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Agent } from '../types';

export interface PublishResult {
  id: string;
  registryUrl: string;
  pullRequestUrl?: string;
}

export class PublishService {
  private readonly githubToken: string;
  private readonly registryRepo = 'chameleon-nexus/agents-registry';
  private readonly registryBranch = 'master';

  constructor() {
    // Get GitHub token from environment or config
    this.githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
    
    if (!this.githubToken) {
      console.warn('Warning: No GitHub token found. Publishing will create local files only.');
      console.warn('Set GITHUB_TOKEN environment variable to enable direct publishing.');
    }
  }

  async publishAgent(agentData: Agent, agentFilePath: string, update: boolean = false): Promise<PublishResult> {
    // Create agent directory structure
    const agentDir = path.join('temp-publish', 'agents', agentData.author, agentData.id);
    await fs.ensureDir(agentDir);

    // Create metadata.json
    const metadataPath = path.join(agentDir, 'metadata.json');
    const metadata = {
      id: agentData.id,
      name: agentData.name,
      description: agentData.description,
      author: agentData.author,
      version: agentData.version,
      category: agentData.category,
      tags: agentData.tags || [],
      compatibility: agentData.compatibility,
      rating: agentData.rating || 0,
      downloads: agentData.downloads || 0,
      createdAt: agentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });

    // Copy agent content file
    const agentContentPath = path.join(agentDir, `v${agentData.version}.md`);
    await fs.copy(agentFilePath, agentContentPath);

    // Update registry.json
    await this.updateRegistry(agentData, update);

    const result: PublishResult = {
      id: agentData.id,
      registryUrl: `https://raw.githubusercontent.com/${this.registryRepo}/${this.registryBranch}/agents/${agentData.author}/${agentData.id}/metadata.json`,
    };

    // If we have GitHub token, create PR
    if (this.githubToken) {
      try {
        const prUrl = await this.createPullRequest(agentData, update);
        result.pullRequestUrl = prUrl;
      } catch (error) {
        console.warn('Failed to create pull request:', error instanceof Error ? error.message : String(error));
        console.warn('Files created locally. Please manually create a pull request.');
      }
    } else {
      console.log('Files created locally in temp-publish/ directory.');
      console.log('Please manually create a pull request to the registry repository.');
    }

    return result;
  }

  private async updateRegistry(agentData: Agent, update: boolean): Promise<void> {
    const registryPath = path.join('temp-publish', 'registry.json');
    
    // Load existing registry or create new one
    let registry: any = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalAgents: 0,
      categories: {},
      agents: {},
    };

    if (await fs.pathExists(registryPath)) {
      registry = await fs.readJSON(registryPath);
    }

    // Add or update agent entry
    const agentKey = `${agentData.author}/${agentData.id}`;
    
    if (!update && registry.agents[agentKey]) {
      throw new Error(`Agent ${agentKey} already exists. Use --update to update existing agent.`);
    }

    registry.agents[agentKey] = {
      id: agentData.id,
      author: agentData.author,
      name: agentData.name,
      description: agentData.description,
      category: agentData.category,
      tags: agentData.tags || [],
      compatibility: agentData.compatibility,
      version: agentData.version,
      rating: agentData.rating || 0,
      downloads: agentData.downloads || 0,
      updatedAt: new Date().toISOString(),
    };

    // Update category count
    if (!registry.categories[agentData.category]) {
      registry.categories[agentData.category] = 0;
    }
    registry.categories[agentData.category]++;

    // Update totals
    registry.totalAgents = Object.keys(registry.agents).length;
    registry.lastUpdated = new Date().toISOString();

    // Save updated registry
    await fs.writeJSON(registryPath, registry, { spaces: 2 });
  }

  private async createPullRequest(agentData: Agent, update: boolean): Promise<string> {
    // This is a simplified implementation
    // In a real scenario, you'd use GitHub API to:
    // 1. Fork the repository
    // 2. Create a new branch
    // 3. Commit the changes
    // 4. Create a pull request
    
    const title = update 
      ? `Update agent: ${agentData.author}/${agentData.id} v${agentData.version}`
      : `Add new agent: ${agentData.author}/${agentData.id} v${agentData.version}`;
    
    const body = `
## ${update ? 'Update' : 'New'} Agent: ${agentData.name}

**Author:** ${agentData.author}
**Category:** ${agentData.category}
**Version:** ${agentData.version}
**Compatibility:** ${Object.keys(agentData.compatibility).join(', ')}

### Description
${typeof agentData.description === 'string' ? agentData.description : agentData.description.en || 'No description'}

### Tags
${(agentData.tags || []).join(', ')}

---
*This pull request was automatically generated by the AGT CLI.*
    `.trim();

    // For now, just return a placeholder URL
    // In real implementation, use GitHub API to create the PR
    console.log('Pull request would be created with:');
    console.log('Title:', title);
    console.log('Body:', body);
    
    return `https://github.com/${this.registryRepo}/pull/new`;
  }
}
