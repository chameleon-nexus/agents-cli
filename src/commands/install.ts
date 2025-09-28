import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { InstallerService } from '../services/installer';
import { InstallOptions } from '../types';

export const installCommand = new Command('install')
  .description('Install agents to your local environment')
  .argument('<agent-ids...>', 'agent IDs to install')
  .option('-v, --version <version>', 'specific version to install')
  .option('-t, --target <cli>', 'target CLI (claude-code, codex, copilot)', 'claude-code')
  .option('-f, --force', 'force reinstall if already installed')
  .option('--dry-run', 'show what would be installed without actually installing')
  .option('-y, --yes', 'skip confirmation prompts')
  .action(async (agentIds, options) => {
    try {
      const installer = new InstallerService(options.registry);
      
      const installOptions: InstallOptions = {
        version: options.version,
        target: options.target,
        force: options.force,
        dryRun: options.dryRun,
      };

      // Confirm installation if not in yes mode
      if (!options.yes && !options.dryRun) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Install ${agentIds.length} agent(s) to ${options.target}?`,
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Installation cancelled.'));
          return;
        }
      }

      // Install each agent
      for (const agentId of agentIds) {
        const spinner = ora(`Installing ${agentId}...`).start();
        
        try {
          await installer.installAgent(agentId, installOptions);
          spinner.succeed(`Installed ${chalk.green(agentId)}`);
        } catch (error) {
          spinner.fail(`Failed to install ${chalk.red(agentId)}: ${error instanceof Error ? error.message : String(error)}`);
          
          if (agentIds.length === 1) {
            process.exit(1);
          }
        }
      }

      if (!options.dryRun) {
        console.log(chalk.green(`\n✅ Installation complete!`));
        console.log(chalk.gray(`Agents installed to: ${options.target}`));
      }
    } catch (error) {
      console.error(chalk.red('Installation failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
