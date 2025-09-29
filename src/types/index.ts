export interface AgentInfo {
  id: string;
  name: {
    en: string;
    zh: string;
    ja: string;
  };
  description: {
    en: string;
    zh: string;
    ja: string;
  };
  author: string;
  category: string;
  tags: string[];
  version: string;
  versions: Record<string, any>;
  downloads: number;
  rating: number;
  ratingCount?: number;
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
  files?: {
    latest: string;
  };
}

export interface Registry {
  version: string;
  lastUpdated: string;
  totalAgents: number;
  languages: string[];
  categories: Record<string, CategoryInfo>;
  featured: {
    count: number;
    url: string;
    description: {
      en: string;
      zh: string;
      ja: string;
    };
  };
  stats: RegistryStats;
}

export interface CategoryInfo {
  count: number;
  url: string;
  name: {
    en: string;
    zh: string;
    ja: string;
  };
  description: {
    en: string;
    zh: string;
    ja: string;
  };
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
  language?: string;  // 新增：语言过滤条件 (en, zh, ja, etc.)
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

export interface Agent {
  id: string;
  name: {
    en: string;
    zh: string;
  } | string;
  description: {
    en: string;
    zh: string;
  } | string;
  author: string;
  category: string;
  version: string;
  compatibility: {
    'claude-code'?: boolean;
    'codex'?: boolean;
    'copilot'?: boolean;
  };
  tags?: string[];
  rating?: number;
  downloads?: number;
  createdAt?: string;
  updatedAt?: string;
}

