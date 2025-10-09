import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';

const CATEGORIES = [
  'core-architecture',
  'web-programming',
  'systems-programming',
  'enterprise-programming',
  'ui-mobile',
  'specialized-platforms',
  'devops-deployment',
  'database-management',
  'incident-network',
  'code-quality',
  'testing-debugging',
  'performance-observability',
  'machine-learning',
  'data-analytics',
  'seo-content',
  'documentation',
  'business-finance',
  'marketing-sales',
  'support-legal',
  'specialized-domains',
];

export const initCommand = new Command('init')
  .description('Create a new agent file with metadata template')
  .argument('[filename]', 'agent filename', 'agent.md')
  .action(async (filename: string) => {
    try {
      console.log(chalk.blue('🚀 Create New Agent\n'));

      // Check if file already exists
      if (await fs.pathExists(filename)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${filename} already exists. Overwrite?`,
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }
      }

      // Collect metadata (only essential info)
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name_en',
          message: 'Agent Name:',
          validate: (input: string) => input ? true : 'Name is required',
        },
        {
          type: 'input',
          name: 'description_en',
          message: 'Description:',
          validate: (input: string) => input ? true : 'Description is required',
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: CATEGORIES,
          default: 'core-architecture',
        },
      ]);

      // Auto-generate ID from name
      const id = answers.name_en
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')          // Spaces to hyphens
        .replace(/-+/g, '-')           // Multiple hyphens to single
        .replace(/^-|-$/g, '');        // Trim hyphens

      // Auto-generate tags from name and category
      const tags = [
        ...answers.name_en.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3),
        answers.category,
      ].slice(0, 5); // Max 5 tags

      const version = '1.0.0';
      const license = 'MIT';

      // Generate template content
      const template = `---
id: ${id}
version: ${version}
category: ${answers.category}
name_en: ${answers.name_en}
description_en: ${answers.description_en}
tags: [${tags.join(', ')}]
license: ${license}
---

# ${answers.name_en}

${answers.description_en}

## Features

- Feature 1: [Describe your agent's main feature]
- Feature 2: [Add more features as needed]
- Feature 3: [...]

## Usage

[Explain how to use this agent]

### Basic Usage

\`\`\`
[Add code examples or usage instructions here]
\`\`\`

### Advanced Usage

[Optional: Add advanced usage examples]

## Examples

\`\`\`
[Add practical examples that demonstrate your agent's capabilities]
\`\`\`

## Configuration

[If applicable, describe configuration options]

## Best Practices

[Share tips and best practices for using this agent]

## Limitations

[Optional: Mention any known limitations]

## Notes

[Any additional notes or information]

---

**Created with AGT CLI** - [AGTHub](https://www.agthub.org)
`;

      // Write file
      await fs.writeFile(filename, template, 'utf8');

      console.log(chalk.green('\n✓'), `Agent file created: ${chalk.cyan(filename)}`);
      console.log(chalk.gray('\nGenerated:'));
      console.log(chalk.gray('  ID:'), chalk.cyan(id));
      console.log(chalk.gray('  Version:'), chalk.cyan(version));
      console.log(chalk.gray('  Tags:'), chalk.cyan(tags.join(', ')));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Edit'), chalk.cyan(filename), chalk.gray('and add your agent content'));
      console.log(chalk.gray('  2. Run'), chalk.yellow(`agt publish ${filename}`));

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

