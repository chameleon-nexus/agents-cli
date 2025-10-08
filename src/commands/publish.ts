import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { ConfigService } from '../services/config';
import { parseAgentFile } from '../utils/agentParser';

export const publishCommand = new Command('publish')
  .description('Publish an agent to AGTHub')
  .argument('[file]', 'Agent markdown file to publish', '.cursor/agent.md')
  .option('--category <category>', 'Override agent category')
  .option('--homepage <url>', 'Override homepage URL')
  .option('--license <license>', 'Override license')
  .action(async (file: string, options) => {
    const config = ConfigService.getInstance();
    const token = config.get('token');
    const apiUrl = config.get('apiUrl') || 'https://www.agthub.org';

    if (!token) {
      console.error(chalk.red('❌ Not logged in. Please run'), chalk.yellow('agt login'), chalk.red('first'));
      process.exit(1);
    }

    try {
      // Resolve file path
      const filePath = path.resolve(process.cwd(), file);
      
      if (!await fs.pathExists(filePath)) {
        console.error(chalk.red(`❌ File not found: ${filePath}`));
        process.exit(1);
      }

      console.log(chalk.blue('📤 Publishing Agent\n'));

      // Read and parse agent file
      const spinner = ora('Parsing agent file...').start();
      const content = await fs.readFile(filePath, 'utf-8');
      
      let metadata: any;
      try {
        metadata = parseAgentFile(content);
      } catch (error: any) {
        spinner.fail('Failed to parse agent file');
        console.error(chalk.red(error.message));
        process.exit(1);
      }

      spinner.succeed('Agent file parsed');

      // Override with command line options
      if (options.category) metadata.category = options.category;
      if (options.homepage) metadata.homepage = options.homepage;
      if (options.license) metadata.license = options.license;

      // Validate required fields
      const errors: string[] = [];
      if (!metadata.id) errors.push('Missing required field: id');
      if (!metadata.version) errors.push('Missing required field: version');
      if (!metadata.category) errors.push('Missing required field: category');
      
      // Check at least one language
      const hasEn = metadata.name_en && metadata.description_en;
      const hasZh = metadata.name_zh && metadata.description_zh;
      const hasJa = metadata.name_ja && metadata.description_ja;
      const hasVi = metadata.name_vi && metadata.description_vi;
      
      if (!hasEn && !hasZh && !hasJa && !hasVi) {
        errors.push('At least one language (name + description) is required');
      }

      if (errors.length > 0) {
        spinner.fail('Validation failed');
        errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
        process.exit(1);
      }

      // Display agent info
      console.log(chalk.gray('Agent ID:'), chalk.cyan(metadata.id));
      console.log(chalk.gray('Version:'), chalk.cyan(metadata.version));
      console.log(chalk.gray('Category:'), chalk.cyan(metadata.category));
      if (metadata.name_en) console.log(chalk.gray('Name (EN):'), chalk.cyan(metadata.name_en));
      if (metadata.name_zh) console.log(chalk.gray('Name (ZH):'), chalk.cyan(metadata.name_zh));
      console.log();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', new Blob([content], { type: 'text/markdown' }), `${metadata.id}_v${metadata.version}.md`);
      formData.append('agentId', metadata.id);
      formData.append('version', metadata.version);
      formData.append('category', metadata.category);

      if (metadata.name_en) formData.append('name_en', metadata.name_en);
      if (metadata.name_zh) formData.append('name_zh', metadata.name_zh);
      if (metadata.name_ja) formData.append('name_ja', metadata.name_ja);
      if (metadata.name_vi) formData.append('name_vi', metadata.name_vi);

      if (metadata.description_en) formData.append('description_en', metadata.description_en);
      if (metadata.description_zh) formData.append('description_zh', metadata.description_zh);
      if (metadata.description_ja) formData.append('description_ja', metadata.description_ja);
      if (metadata.description_vi) formData.append('description_vi', metadata.description_vi);

      if (metadata.homepage) formData.append('homepage', metadata.homepage);
      if (metadata.license) formData.append('license', metadata.license);

      // Publish to AGTHub
      const publishSpinner = ora('Publishing to AGTHub...').start();

      try {
        const response = await axios.post(
          `${apiUrl}/api/cli/agents/publish`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );

        const { agent, needsReview, message } = response.data;

        publishSpinner.succeed(message);

        console.log(chalk.green('\n✓ Agent published successfully!'));
        console.log(chalk.gray('  ID:'), chalk.cyan(agent.agentId));
        console.log(chalk.gray('  Version:'), chalk.cyan(agent.version));
        console.log(chalk.gray('  Status:'), chalk.yellow(agent.status));
        
        if (needsReview) {
          console.log(chalk.yellow('\n⚠️  Your agent is pending review due to content policy.'));
          console.log(chalk.gray('   It will be visible on AGTHub after admin approval.'));
        } else {
          console.log(chalk.green('\n🎉 Your agent is now live on AGTHub!'));
          console.log(chalk.gray('   View it at:'), chalk.blue(`${apiUrl}/?q=${agent.agentId}`));
        }

      } catch (error: any) {
        publishSpinner.fail('Publish failed');
        
        if (error.response?.status === 401) {
          console.error(chalk.red('Authentication failed. Please run'), chalk.yellow('agt login'), chalk.red('again'));
        } else if (error.response?.status === 409) {
          console.error(chalk.red('Agent already exists with this version'));
          console.log(chalk.gray('  Tip: Increment the version number in your agent file'));
        } else if (error.response?.data?.error) {
          console.error(chalk.red(error.response.data.error));
        } else {
          console.error(chalk.red('Failed to publish agent. Please try again.'));
          if (error.message) {
            console.error(chalk.gray(error.message));
          }
        }
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('Publish process failed:'), error.message);
      process.exit(1);
    }
  });


