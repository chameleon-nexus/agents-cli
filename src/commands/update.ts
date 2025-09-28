import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { InstallerService } from '../services/installer';

export const updateCommand = new Command('update')
  .description('Update installed agents')
  .argument('[agent-ids...]', 'specific agents to update (default: all)')
  .option('--check', 'only check for updates without installing')
  .option('--dry-run', 'show what would be updated without actually updating')
  .option('-y, --yes', 'skip confirmation prompts')
  .action(async (agentIds, options) => {
    try {
      const installer = new InstallerService(options.registry);
      
      // Get available updates
      const spinner = ora('Checking for updates...').start();
      const allUpdates = await installer.checkForUpdates();
      spinner.stop();

      // Filter updates if specific agents requested
      let updates = allUpdates;
      if (agentIds.length > 0) {
        updates = allUpdates.filter(update => 
          agentIds.includes(update.agent.id)
        );
        
        // Check if any requested agents weren't found
        const foundIds = updates.map(u => u.agent.id);
        const notFound = agentIds.filter((id: string) => !foundIds.includes(id));
        if (notFound.length > 0) {
          console.warn(chalk.yellow(`Agents not found or up to date: ${notFound.join(', ')}`));
        }
      }

      if (updates.length === 0) {
        console.log(chalk.green('All agents are up to date!'));
        return;
      }

      // Display available updates
      console.log(chalk.cyan(`Found ${updates.length} update(s):`));
      for (const { agent, latestVersion } of updates) {
        console.log(`  ${agent.id}: ${agent.version} → ${chalk.green(latestVersion)} (${agent.target})`);
      }

      if (options.check) {
        return;
      }

      if (options.dryRun) {
        console.log(chalk.yellow('\nDry run - no changes made'));
        return;
      }

      // Confirm updates
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Update ${updates.length} agent(s)?`,
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Update cancelled.'));
          return;
        }
      }

      // Perform updates
      let successCount = 0;
      let failCount = 0;

      for (const { agent, latestVersion } of updates) {
        const updateSpinner = ora(`Updating ${agent.id}...`).start();
        
        try {
          await installer.installAgent(agent.id, {
            version: latestVersion,
            target: agent.target as 'claude-code' | 'codex' | 'copilot',
            force: true, // Force reinstall for updates
          });
          
          updateSpinner.succeed(`Updated ${chalk.green(agent.id)} to ${latestVersion}`);
          successCount++;
        } catch (error) {
          updateSpinner.fail(`Failed to update ${chalk.red(agent.id)}: ${error instanceof Error ? error.message : String(error)}`);
          failCount++;
        }
      }

      // Summary
      console.log(chalk.green(`\n✅ Update complete!`));
      console.log(chalk.gray(`Successfully updated: ${successCount}`));
      if (failCount > 0) {
        console.log(chalk.red(`Failed to update: ${failCount}`));
      }
    } catch (error) {
      console.error(chalk.red('Update failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
