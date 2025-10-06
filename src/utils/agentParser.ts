/**
 * Parse agent markdown file to extract metadata
 */
export function parseAgentFile(content: string): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract YAML frontmatter if present
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    
    // Parse YAML-like frontmatter (simple key: value pairs)
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim().replace(/^["'](.+)["']$/, '$1'); // Remove quotes
      }
    }
  }

  // Extract metadata from markdown headers
  const headerPatterns: Record<string, RegExp> = {
    id: /^#+\s*(?:ID|Agent ID|AgentID):\s*(.+)$/im,
    version: /^#+\s*(?:Version):\s*(.+)$/im,
    category: /^#+\s*(?:Category):\s*(.+)$/im,
    
    // English
    name_en: /^#+\s*(?:Name \(EN\)|Name \(English\)|Name-EN|NameEN):\s*(.+)$/im,
    description_en: /^#+\s*(?:Description \(EN\)|Description \(English\)|Description-EN|DescriptionEN):\s*(.+)$/im,
    
    // Chinese
    name_zh: /^#+\s*(?:Name \(ZH\)|Name \(Chinese\)|Name-ZH|NameZH|名称):\s*(.+)$/im,
    description_zh: /^#+\s*(?:Description \(ZH\)|Description \(Chinese\)|Description-ZH|DescriptionZH|描述):\s*(.+)$/im,
    
    // Japanese
    name_ja: /^#+\s*(?:Name \(JA\)|Name \(Japanese\)|Name-JA|NameJA|名前):\s*(.+)$/im,
    description_ja: /^#+\s*(?:Description \(JA\)|Description \(Japanese\)|Description-JA|DescriptionJA|説明):\s*(.+)$/im,
    
    // Vietnamese
    name_vi: /^#+\s*(?:Name \(VI\)|Name \(Vietnamese\)|Name-VI|NameVI):\s*(.+)$/im,
    description_vi: /^#+\s*(?:Description \(VI\)|Description \(Vietnamese\)|Description-VI|DescriptionVI):\s*(.+)$/im,
    
    homepage: /^#+\s*(?:Homepage|URL|Website):\s*(.+)$/im,
    license: /^#+\s*(?:License):\s*(.+)$/im,
  };

  for (const [key, pattern] of Object.entries(headerPatterns)) {
    const match = content.match(pattern);
    if (match && !metadata[key]) {
      metadata[key] = match[1].trim();
    }
  }

  // If no structured metadata found, try to extract from first heading
  if (!metadata.name_en) {
    const firstHeadingMatch = content.match(/^#+\s*(.+)$/m);
    if (firstHeadingMatch) {
      metadata.name_en = firstHeadingMatch[1].trim();
    }
  }

  // Extract description from content if not found
  if (!metadata.description_en) {
    // Look for first paragraph after heading
    const paragraphMatch = content.match(/^#+.+\n\n(.+)/m);
    if (paragraphMatch) {
      metadata.description_en = paragraphMatch[1].trim().substring(0, 200); // Limit to 200 chars
    }
  }

  return metadata;
}
