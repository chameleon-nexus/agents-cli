#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search';
import { installCommand } from './commands/install';
import { listCommand } from './commands/list';
import { updateCommand } from './commands/update';
import { configCommand } from './commands/config';

const program = new Command();

program
  .name('agt')
  .description('AGT - AI Agent Management Tool for Chameleon Registry')
  .version('1.3.0')
  .option('-v, --verbose', 'verbose output')
  .option('--registry <url>', 'registry URL')
  .option('--config <path>', 'config file path');

// Add commands
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(listCommand);
program.addCommand(updateCommand);
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

