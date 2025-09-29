import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { RegistryService } from '../services/registry';
import { SearchFilters } from '../types';

export const searchCommand = new Command('search')
  .description('Search for agents in the registry')
  .argument('[query]', 'search query')
  .option('-c, --category <category>', 'filter by category')
  .option('-t, --tag <tag>', 'filter by tag')
  .option('-a, --author <author>', 'filter by author')
  .option('--compatibility <cli>', 'filter by CLI compatibility (claude-code, codex, copilot)')
  .option('--language <lang>', 'filter by language (en, zh, ja, etc.) - only shows agents with content in specified language')
  .option('-s, --sort <field>', 'sort by field (downloads, rating, name, updated)', 'downloads')
  .option('-l, --limit <number>', 'limit number of results', '20')
  .option('--json', 'output as JSON')
  .action(async (query, options) => {
    try {
      const registryService = new RegistryService(options.registry);
      
      const filters: SearchFilters = {
        category: options.category,
        tag: options.tag,
        author: options.author,
        compatibility: options.compatibility,
        language: options.language,
        sortBy: options.sort,
        limit: parseInt(options.limit),
      };

      const agents = await registryService.searchAgents(query, filters);

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found matching your criteria.'));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(agents, null, 2));
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
        console.log(chalk.gray(`Showing first ${filters.limit} results. Use --limit to see more.`));
      }
    } catch (error) {
      console.error(chalk.red('Error searching agents:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
