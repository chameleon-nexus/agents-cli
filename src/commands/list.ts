import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { InstallerService } from '../services/installer';
import { RegistryService } from '../services/registry';

export const listCommand = new Command('list')
  .description('List available or installed agents')
  .option('-i, --installed', 'list installed agents only')
  .option('-u, --updates', 'list agents with available updates')
  .option('-c, --category <category>', 'filter by category')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const installer = new InstallerService(options.registry);
      const registry = new RegistryService(options.registry);

      if (options.installed) {
        await listInstalledAgents(installer, options);
      } else if (options.updates) {
        await listUpdates(installer, options);
      } else {
        await listAvailableAgents(registry, options);
      }
    } catch (error) {
      console.error(chalk.red('Error listing agents:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function listInstalledAgents(installer: InstallerService, options: any) {
  const installed = await installer.getInstalledAgents();
  
  if (installed.length === 0) {
    console.log(chalk.yellow('No agents installed.'));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(installed, null, 2));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Version'),
      chalk.cyan('Target'),
      chalk.cyan('Installed'),
    ],
    colWidths: [25, 12, 15, 20],
  });

  for (const agent of installed) {
    table.push([
      agent.id,
      agent.version,
      agent.target,
      new Date(agent.installedAt).toLocaleDateString(),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.gray(`\n${installed.length} agent(s) installed`));
}

async function listUpdates(installer: InstallerService, options: any) {
  const updates = await installer.checkForUpdates();
  
  if (updates.length === 0) {
    console.log(chalk.green('All agents are up to date!'));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(updates, null, 2));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Current'),
      chalk.cyan('Latest'),
      chalk.cyan('Target'),
    ],
    colWidths: [25, 12, 12, 15],
  });

  for (const { agent, latestVersion } of updates) {
    table.push([
      agent.id,
      agent.version,
      chalk.green(latestVersion),
      agent.target,
    ]);
  }

  console.log(table.toString());
  console.log(chalk.yellow(`\n${updates.length} update(s) available`));
  console.log(chalk.gray('Run "agents update" to update all agents'));
}

async function listAvailableAgents(registry: RegistryService, options: any) {
  const filters = {
    category: options.category,
    limit: 50, // Default limit for available agents
  };

  const agents = await registry.searchAgents('', filters);
  
  if (agents.length === 0) {
    console.log(chalk.yellow('No agents found.'));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(agents, null, 2));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Name'),
      chalk.cyan('Author'),
      chalk.cyan('Category'),
      chalk.cyan('Downloads'),
      chalk.cyan('Rating'),
    ],
    colWidths: [20, 25, 15, 15, 12, 10],
  });

  for (const agent of agents) {
    table.push([
      agent.id,
      agent.name.en,
      agent.author,
      agent.category,
      agent.downloads.toLocaleString(),
      `${agent.rating.toFixed(1)}/5`,
    ]);
  }

  console.log(table.toString());
  console.log(chalk.gray(`\nShowing ${agents.length} agent(s)`));
}
