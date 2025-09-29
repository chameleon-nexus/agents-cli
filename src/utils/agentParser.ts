import * as fs from 'fs-extra';
import * as path from 'path';
import { Agent } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ParsedFrontmatter {
  [key: string]: any;
}

export async function validateAgentFile(filePath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  
  try {
    if (!await fs.pathExists(filePath)) {
      errors.push('File does not exist');
      return { isValid: false, errors };
    }

    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check if file has frontmatter
    if (!content.startsWith('---')) {
      errors.push('File must start with YAML frontmatter (---)');
      return { isValid: false, errors };
    }

    // Parse frontmatter
    const frontmatter = parseFrontmatter(content);
    
    // Required fields validation
    const requiredFields = ['name', 'description', 'author', 'category'];
    for (const field of requiredFields) {
      if (!frontmatter[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate name
    if (frontmatter.name && typeof frontmatter.name !== 'string' && typeof frontmatter.name !== 'object') {
      errors.push('Name must be a string or object with language keys');
    }

    // Validate description
    if (frontmatter.description && typeof frontmatter.description !== 'string' && typeof frontmatter.description !== 'object') {
      errors.push('Description must be a string or object with language keys');
    }

    // Validate category
    const validCategories = [
      'development', 'productivity', 'writing', 'analysis', 'automation',
      'debugging', 'testing', 'documentation', 'design', 'other'
    ];
    if (frontmatter.category && !validCategories.includes(frontmatter.category)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate compatibility
    if (frontmatter.compatibility) {
      const validCliTools = ['claude-code', 'codex', 'copilot'];
      const compatibility = frontmatter.compatibility;
      
      if (typeof compatibility !== 'object') {
        errors.push('Compatibility must be an object');
      } else {
        for (const cli of Object.keys(compatibility)) {
          if (!validCliTools.includes(cli)) {
            errors.push(`Invalid CLI tool in compatibility: ${cli}. Must be one of: ${validCliTools.join(', ')}`);
          }
        }
      }
    }

    // Validate version format
    if (frontmatter.version && !/^\d+\.\d+\.\d+$/.test(frontmatter.version)) {
      errors.push('Version must be in semver format (e.g., 1.0.0)');
    }

    // Check if content exists after frontmatter
    const contentWithoutFrontmatter = content.split('---').slice(2).join('---').trim();
    if (!contentWithoutFrontmatter) {
      errors.push('File must contain content after frontmatter');
    }

  } catch (error) {
    errors.push(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function parseAgentFile(filePath: string, options: any = {}): Promise<Agent> {
  const content = await fs.readFile(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);
  
  // Generate ID from filename if not provided
  const filename = path.basename(filePath, '.md');
  const id = frontmatter.id || filename.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Normalize name and description to support both string and object formats
  const name = normalizeLocalizedField(frontmatter.name, frontmatter.name || filename);
  const description = normalizeLocalizedField(frontmatter.description, frontmatter.description || '');

  // Set defaults
  const agent: Agent = {
    id,
    name,
    description,
    author: options.author || frontmatter.author || 'unknown',
    category: options.category || frontmatter.category || 'other',
    version: frontmatter.version || '1.0.0',
    compatibility: frontmatter.compatibility || { 'claude-code': true },
    tags: frontmatter.tags || [],
    rating: frontmatter.rating || 0,
    downloads: frontmatter.downloads || 0,
    createdAt: frontmatter.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return agent;
}

function parseFrontmatter(content: string): ParsedFrontmatter {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    return {};
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return {};
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const frontmatter: ParsedFrontmatter = {};

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays (simple format)
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      frontmatter[key] = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
    }
    // Handle boolean values
    else if (value === 'true' || value === 'false') {
      frontmatter[key] = value === 'true';
    }
    // Handle numbers
    else if (!isNaN(Number(value)) && value !== '') {
      frontmatter[key] = Number(value);
    }
    // Handle objects (simple key-value format)
    else if (key === 'compatibility' && value.includes(':')) {
      const obj: any = {};
      const pairs = value.split(',');
      for (const pair of pairs) {
        const [k, v] = pair.split(':').map(s => s.trim());
        if (k && v !== undefined) {
          obj[k] = v === 'true' || v === 'false' ? v === 'true' : v;
        }
      }
      frontmatter[key] = obj;
    }
    // Default to string
    else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function normalizeLocalizedField(field: any, fallback: string): any {
  if (typeof field === 'string') {
    return { en: field, zh: field };
  } else if (typeof field === 'object' && field !== null) {
    return {
      en: field.en || fallback,
      zh: field.zh || field.en || fallback,
      ...field
    };
  }
  return { en: fallback, zh: fallback };
}
