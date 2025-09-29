import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { InstallerService } from '../services/installer';

export const uninstallCommand = new Command('uninstall')
  .description('Uninstall agents from your local environment')
  .argument('<agent-ids...>', 'agent IDs to uninstall')
  .option('-t, --target <cli>', 'target CLI (claude-code, codex, copilot)', 'claude-code')
  .action(async (agentIds, options) => {
    try {
      const installer = new InstallerService(options.registry);
      
      // Uninstall each agent
      for (const agentId of agentIds) {
        const spinner = ora(`Uninstalling ${agentId}...`).start();
        
        try {
          await installer.uninstallAgent(agentId, options.target);
          spinner.succeed(`Uninstalled ${chalk.green(agentId)}`);
        } catch (error) {
          spinner.fail(`Failed to uninstall ${chalk.red(agentId)}: ${error instanceof Error ? error.message : String(error)}`);
          
          if (agentIds.length === 1) {
            process.exit(1);
          }
        }
      }

      console.log(chalk.green(`\n✅ Uninstallation complete!`));
      console.log(chalk.gray(`Agents removed from: ${options.target}`));
    } catch (error) {
      console.error(chalk.red('Uninstallation failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

