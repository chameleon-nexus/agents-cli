import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AgentInfo, InstallOptions, InstalledAgent } from '../types';
import { RegistryService } from './registry';
import { ConfigService } from './config';

export class InstallerService {
  private configService = new ConfigService();
  private registryService: RegistryService;

  constructor(registryUrl?: string) {
    this.registryService = new RegistryService(registryUrl);
  }

  async installAgent(agentId: string, options: InstallOptions = {}): Promise<void> {
    const config = await this.configService.getConfig();
    
    // Parse agent ID to extract version if specified
    const { parsedId, version: parsedVersion } = this.parseAgentId(agentId);
    const agent = await this.registryService.getAgentDetails(parsedId);
    
    if (!agent) {
      throw new Error(`Agent ${parsedId} not found`);
    }

    // Priority: explicit version option > parsed version from ID > agent default version
    const version = options.version || parsedVersion || agent.version;
    const target = options.target || config.install.target;
    
    // Check if already installed
    const installed = await this.getInstalledAgents();
    const existing = installed.find(a => a.id === agentId && a.target === target);
    
    if (existing && !options.force) {
      throw new Error(`Agent ${agentId} is already installed for ${target}. Use --force to reinstall.`);
    }

    if (options.dryRun) {
      console.log(`Would install ${agentId}@${version} to ${target}`);
      return;
    }

    // Download agent content
    const content = await this.registryService.downloadAgent(agentId, version);
    
    // Determine install path
    const installPath = await this.getInstallPath(target, agentId, version);
    await fs.ensureDir(path.dirname(installPath));
    
    // Write agent file
    await fs.writeFile(installPath, content);
    
    // Update installed agents registry
    await this.registerInstalledAgent({
      id: agentId,
      version,
      installedAt: new Date().toISOString(),
      target,
      path: installPath,
    });

    console.log(`Successfully installed ${agentId}@${version} to ${target}`);
  }

  async uninstallAgent(agentId: string, target?: string): Promise<void> {
    const config = await this.configService.getConfig();
    const targetCli = target || config.install.target;
    
    // Parse agent ID to handle author/agent format
    const { parsedId } = this.parseAgentId(agentId);
    
    const installed = await this.getInstalledAgents();
    const agent = installed.find(a => a.id === parsedId && a.target === targetCli);
    
    if (!agent) {
      throw new Error(`Agent ${parsedId} is not installed for ${targetCli}`);
    }

    // Remove file
    if (await fs.pathExists(agent.path)) {
      await fs.remove(agent.path);
    }

    // Update registry
    const remaining = installed.filter(a => !(a.id === parsedId && a.target === targetCli));
    await this.saveInstalledAgents(remaining);

    console.log(`Successfully uninstalled ${parsedId} from ${targetCli}`);
  }

  async getInstalledAgents(): Promise<InstalledAgent[]> {
    // Use centralized registry file under .agents for cross-CLI compatibility
    const registryPath = path.join(os.homedir(), '.agents', 'installed.json');
    
    try {
      if (await fs.pathExists(registryPath)) {
        const content = await fs.readFile(registryPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to read installed agents registry:', error);
    }
    
    return [];
  }

  async checkForUpdates(): Promise<Array<{ agent: InstalledAgent; latestVersion: string }>> {
    const installed = await this.getInstalledAgents();
    const updates: Array<{ agent: InstalledAgent; latestVersion: string }> = [];

    for (const agent of installed) {
      try {
        const latest = await this.registryService.getAgentDetails(agent.id);
        if (latest && latest.version !== agent.version) {
          updates.push({ agent, latestVersion: latest.version });
        }
      } catch (error) {
        console.warn(`Failed to check updates for ${agent.id}:`, error);
      }
    }

    return updates;
  }

  private async getInstallPath(target: string, agentId: string, version: string): Promise<string> {
    const homeDir = os.homedir();
    
    // Extract author and agent name from "author/agent-name" format
    const [author, agentName] = agentId.includes('/') 
      ? agentId.split('/') 
      : ['unknown', agentId];
    
    // Create filename with format: author_agent-name_version.md
    const filename = `${author}_${agentName}_v${version}.md`;
    
    switch (target) {
      case 'claude-code':
        // Install to Claude Code's user agents directory: ~/.claude/agents/
        return path.join(homeDir, '.claude', 'agents', filename);
      case 'codex':
        // Install to Codex agents directory: ~/.codex/agents/
        return path.join(homeDir, '.codex', 'agents', filename);
      case 'copilot':
        // Install to Copilot agents directory: ~/.copilot/agents/
        return path.join(homeDir, '.copilot', 'agents', filename);
      default:
        // Fallback for unknown targets
        return path.join(homeDir, `.${target}`, 'agents', filename);
    }
  }

  private async registerInstalledAgent(agent: InstalledAgent): Promise<void> {
    const installed = await this.getInstalledAgents();
    
    // Remove existing entry for same agent and target
    const filtered = installed.filter(a => !(a.id === agent.id && a.target === agent.target));
    filtered.push(agent);
    
    await this.saveInstalledAgents(filtered);
  }

  private async saveInstalledAgents(agents: InstalledAgent[]): Promise<void> {
    // Use centralized registry file under .agents for cross-CLI compatibility
    const registryPath = path.join(os.homedir(), '.agents', 'installed.json');
    
    await fs.ensureDir(path.dirname(registryPath));
    await fs.writeFile(registryPath, JSON.stringify(agents, null, 2));
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
}

