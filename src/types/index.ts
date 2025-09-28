export interface AgentInfo {
  id: string;
  name: {
    en: string;
    zh: string;
  };
  description: {
    en: string;
    zh: string;
  };
  author: string;
  category: string;
  tags: string[];
  latest: string;
  versions: string[];
  downloads: number;
  rating: number;
  ratingCount: number;
  license: string;
  compatibility: {
    claudeCode?: {
      minVersion: string;
      tested: string[];
    };
    codex?: {
      minVersion: string;
      tested: string[];
    };
    copilot?: {
      minVersion: string;
      tested: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
  homepage?: string;
  repository?: string;
  documentation?: string;
}

export interface Registry {
  version: string;
  lastUpdated: string;
  totalAgents: number;
  agents: Record<string, AgentInfo>;
  categories: Record<string, CategoryInfo>;
  stats: RegistryStats;
}

export interface CategoryInfo {
  en: string;
  zh: string;
  description: {
    en: string;
    zh: string;
  };
  icon: string;
}

export interface RegistryStats {
  totalDownloads: number;
  activeUsers: number;
  topAgents: string[];
  recentUpdates: string[];
}

export interface SearchFilters {
  category?: string;
  tag?: string;
  author?: string;
  compatibility?: 'claudeCode' | 'codex' | 'copilot';
  sortBy?: 'downloads' | 'rating' | 'name' | 'updated';
  limit?: number;
}

export interface InstallOptions {
  version?: string;
  target?: 'claude-code' | 'codex' | 'copilot';
  force?: boolean;
  dryRun?: boolean;
  global?: boolean;
}

export interface Config {
  registry: {
    url: string;
    cacheTtl: number;
  };
  install: {
    target: string;
    directory: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface InstalledAgent {
  id: string;
  version: string;
  installedAt: string;
  target: string;
  path: string;
}
