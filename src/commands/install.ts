import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { InstallerService } from '../services/installer';
import { InstallOptions } from '../types';

export const installCommand = new Command('install')
  .description('Install an agent')
  .argument('<agent>', 'agent ID to install in format: author/agent-id (e.g., wshobson/ruby-pro)')
  .action(async (agentId) => {
    try {
      // Validate format: must contain author/agent-id
      if (!agentId.includes('/')) {
        console.error(chalk.red('Error:'), 'Agent ID must be in format: author/agent-id');
        console.log(chalk.yellow('Example:'), 'agt install wshobson/ruby-pro');
        console.log(chalk.gray('Tip: Use "agt search <keyword>" to find agents and their full IDs'));
        process.exit(1);
      }

      const installer = new InstallerService();
      const spinner = ora(`Installing ${agentId}...`).start();
      
      const installOptions: InstallOptions = {
        target: 'claude-code',
      };

      await installer.installAgent(agentId, installOptions);
      spinner.succeed(`Installed ${chalk.green(agentId)}`);
      console.log(chalk.gray(`Installed to: ~/.agents/${agentId}`));
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
