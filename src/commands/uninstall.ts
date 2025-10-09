import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { InstallerService } from '../services/installer';

export const uninstallCommand = new Command('uninstall')
  .description('Uninstall an agent')
  .argument('<agent>', 'agent ID to uninstall')
  .action(async (agentId) => {
    try {
      const installer = new InstallerService();
      const spinner = ora(`Uninstalling ${agentId}...`).start();
      
      await installer.uninstallAgent(agentId);
      spinner.succeed(`Uninstalled ${chalk.green(agentId)}`);
      
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
