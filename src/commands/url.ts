import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../services/config';

export const urlCommand = new Command('url')
  .description('View or set AGTHub API URL')
  .argument('[url]', 'API URL to set (leave empty to view current URL)')
  .action(async (url?: string) => {
    const config = ConfigService.getInstance();

    if (!url) {
      // View current URL
      const currentUrl = config.get('apiUrl') || 'https://www.agthub.org';
      console.log(chalk.cyan('Current API URL:'), chalk.green(currentUrl));
      return;
    }

    // Set new URL
    try {
      new URL(url); // Validate URL format
      config.set('apiUrl', url);
      config.save();
      console.log(chalk.green('✓'), 'API URL updated to:', chalk.cyan(url));
    } catch (error) {
      console.error(chalk.red('✗'), 'Invalid URL format');
      console.log(chalk.gray('Example:'), 'agt url https://www.agthub.org');
      process.exit(1);
    }
  });

