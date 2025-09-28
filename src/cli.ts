#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search';
import { installCommand } from './commands/install';
import { listCommand } from './commands/list';
import { updateCommand } from './commands/update';
import { publishCommand } from './commands/publish';
import { configCommand } from './commands/config';

const program = new Command();

program
  .name('agents')
  .description('Chameleon Agent CLI - Manage AI agents for your development workflow')
  .version('1.0.0')
  .option('-v, --verbose', 'verbose output')
  .option('--registry <url>', 'registry URL')
  .option('--config <path>', 'config file path');

// Add commands
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(listCommand);
program.addCommand(updateCommand);
program.addCommand(publishCommand);
program.addCommand(configCommand);

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Parse arguments
program.parse();
