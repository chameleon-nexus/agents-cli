import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { InstallerService } from '../services/installer';
import { InstallOptions } from '../types';

export const installCommand = new Command('install')
  .description('Install an agent')
  .argument('<agent>', 'agent ID to install (e.g., code-reviewer)')
  .action(async (agentId) => {
    try {
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
