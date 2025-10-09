import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { RegistryService } from '../services/registry';
import { SearchFilters } from '../types';

export const searchCommand = new Command('search')
  .description('Search for agents')
  .argument('[keyword]', 'search keyword (leave empty to list all)')
  .action(async (keyword) => {
    const query = keyword || '';
    const options = { limit: '20' };
    try {
      const registryService = new RegistryService();
      
      const filters: SearchFilters = {
        sortBy: 'downloads',
        limit: parseInt(options.limit),
      };

      const agents = await registryService.searchAgents(query, filters);

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found.'));
        return;
      }

      // Display results in table format
      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('Name'),
          chalk.cyan('Author'),
          chalk.cyan('Category'),
          chalk.cyan('Downloads'),
          chalk.cyan('Rating'),
          chalk.cyan('Compatible'),
        ],
        colWidths: [20, 25, 15, 15, 12, 10, 15],
      });

      for (const agent of agents) {
        const compatible = [];
        if (agent.compatibility.claudeCode) compatible.push('Claude');
        if (agent.compatibility.codex) compatible.push('Codex');
        if (agent.compatibility.copilot) compatible.push('Copilot');

        table.push([
          agent.id,
          agent.name.en,
          agent.author,
          agent.category,
          agent.downloads.toLocaleString(),
          `${agent.rating.toFixed(1)}/5`,
          compatible.join(', ') || 'None',
        ]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`\nFound ${agents.length} agent(s)`));
      
      if (agents.length >= filters.limit!) {
        console.log(chalk.gray(`Showing first ${filters.limit} results.`));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
