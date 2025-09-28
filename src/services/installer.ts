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
    const agent = await this.registryService.getAgentDetails(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const version = options.version || agent.latest;
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
    const installPath = await this.getInstallPath(target, agentId);
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
    
    const installed = await this.getInstalledAgents();
    const agent = installed.find(a => a.id === agentId && a.target === targetCli);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} is not installed for ${targetCli}`);
    }

    // Remove file
    if (await fs.pathExists(agent.path)) {
      await fs.remove(agent.path);
    }

    // Update registry
    const remaining = installed.filter(a => !(a.id === agentId && a.target === targetCli));
    await this.saveInstalledAgents(remaining);

    console.log(`Successfully uninstalled ${agentId} from ${targetCli}`);
  }

  async getInstalledAgents(): Promise<InstalledAgent[]> {
    const config = await this.configService.getConfig();
    const registryPath = path.join(config.install.directory, 'installed.json');
    
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
        if (latest && latest.latest !== agent.version) {
          updates.push({ agent, latestVersion: latest.latest });
        }
      } catch (error) {
        console.warn(`Failed to check updates for ${agent.id}:`, error);
      }
    }

    return updates;
  }

  private async getInstallPath(target: string, agentId: string): Promise<string> {
    const config = await this.configService.getConfig();
    
    switch (target) {
      case 'claude-code':
        return path.join(config.install.directory, 'claude-code', `${agentId}.md`);
      case 'codex':
        return path.join(config.install.directory, 'codex', `${agentId}.md`);
      case 'copilot':
        return path.join(config.install.directory, 'copilot', `${agentId}.md`);
      default:
        return path.join(config.install.directory, target, `${agentId}.md`);
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
    const config = await this.configService.getConfig();
    const registryPath = path.join(config.install.directory, 'installed.json');
    
    await fs.ensureDir(path.dirname(registryPath));
    await fs.writeFile(registryPath, JSON.stringify(agents, null, 2));
  }
}
