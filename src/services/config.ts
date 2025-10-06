import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';
import { Config } from '../types';

export class ConfigService {
  private static instance: ConfigService;
  private static readonly CONFIG_DIR = path.join(os.homedir(), '.agents-cli');
  private static readonly CONFIG_FILE = path.join(ConfigService.CONFIG_DIR, 'config.yaml');
  
  private config: Record<string, any> = {};
  
  private static readonly DEFAULT_CONFIG: Config = {
    registry: {
      url: 'https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master',
      cacheTtl: 300, // 5 minutes
    },
    install: {
      target: 'claude-code',
      directory: path.join(os.homedir(), '.agents'),
    },
    logging: {
      level: 'info',
    },
    apiUrl: 'https://agthub-qexf.vercel.app',
  };

  private constructor() {
    this.load();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private load(): void {
    try {
      fs.ensureDirSync(ConfigService.CONFIG_DIR);
      
      if (fs.pathExistsSync(ConfigService.CONFIG_FILE)) {
        const content = fs.readFileSync(ConfigService.CONFIG_FILE, 'utf-8');
        this.config = { ...ConfigService.DEFAULT_CONFIG, ...yaml.parse(content) };
      } else {
        this.config = { ...ConfigService.DEFAULT_CONFIG };
        this.save();
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
      this.config = { ...ConfigService.DEFAULT_CONFIG };
    }
  }

  get(key: string): any {
    return this.config[key];
  }

  set(key: string, value: any): void {
    this.config[key] = value;
  }

  save(): void {
    try {
      fs.ensureDirSync(ConfigService.CONFIG_DIR);
      const content = yaml.stringify(this.config, { indent: 2 });
      fs.writeFileSync(ConfigService.CONFIG_FILE, content);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  async getConfig(): Promise<Config> {
    try {
      await fs.ensureDir(ConfigService.CONFIG_DIR);
      
      if (await fs.pathExists(ConfigService.CONFIG_FILE)) {
        const content = await fs.readFile(ConfigService.CONFIG_FILE, 'utf-8');
        const userConfig = yaml.parse(content);
        return { ...ConfigService.DEFAULT_CONFIG, ...userConfig };
      }
      
      // Create default config file
      await this.saveConfig(ConfigService.DEFAULT_CONFIG);
      return ConfigService.DEFAULT_CONFIG;
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
      return ConfigService.DEFAULT_CONFIG;
    }
  }

  async saveConfig(config: Config): Promise<void> {
    await fs.ensureDir(ConfigService.CONFIG_DIR);
    const content = yaml.stringify(config, { indent: 2 });
    await fs.writeFile(ConfigService.CONFIG_FILE, content);
  }

  async updateConfig(updates: Partial<Config>): Promise<Config> {
    const currentConfig = await this.getConfig();
    const newConfig = this.mergeConfig(currentConfig, updates);
    await this.saveConfig(newConfig);
    return newConfig;
  }

  async resetConfig(): Promise<Config> {
    await this.saveConfig(ConfigService.DEFAULT_CONFIG);
    return ConfigService.DEFAULT_CONFIG;
  }

  getConfigPath(): string {
    return ConfigService.CONFIG_FILE;
  }

  private mergeConfig(current: Config, updates: Partial<Config>): Config {
    const result = { ...current };
    
    if (updates.registry) {
      result.registry = { ...result.registry, ...updates.registry };
    }
    
    if (updates.install) {
      result.install = { ...result.install, ...updates.install };
    }
    
    if (updates.logging) {
      result.logging = { ...result.logging, ...updates.logging };
    }
    
    return result;
  }
}

