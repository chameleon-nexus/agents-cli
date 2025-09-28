import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigService } from '../services/config';

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .option('--show', 'show current configuration')
  .option('--reset', 'reset to default configuration')
  .option('--edit', 'interactively edit configuration')
  .action(async (options) => {
    try {
      const configService = new ConfigService();

      if (options.show) {
        await showConfig(configService);
      } else if (options.reset) {
        await resetConfig(configService);
      } else if (options.edit) {
        await editConfig(configService);
      } else {
        // Default: show config
        await showConfig(configService);
      }
    } catch (error) {
      console.error(chalk.red('Config error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function showConfig(configService: ConfigService) {
  const config = await configService.getConfig();
  const configPath = configService.getConfigPath();
  
  console.log(chalk.cyan('Current Configuration:'));
  console.log(chalk.gray(`Config file: ${configPath}\n`));
  
  console.log(chalk.yellow('Registry:'));
  console.log(`  URL: ${config.registry.url}`);
  console.log(`  Cache TTL: ${config.registry.cacheTtl}s\n`);
  
  console.log(chalk.yellow('Installation:'));
  console.log(`  Default target: ${config.install.target}`);
  console.log(`  Directory: ${config.install.directory}\n`);
  
  console.log(chalk.yellow('Logging:'));
  console.log(`  Level: ${config.logging.level}`);
}

async function resetConfig(configService: ConfigService) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Reset configuration to defaults?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Reset cancelled.'));
    return;
  }

  await configService.resetConfig();
  console.log(chalk.green('✅ Configuration reset to defaults'));
}

async function editConfig(configService: ConfigService) {
  const currentConfig = await configService.getConfig();
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'registryUrl',
      message: 'Registry URL:',
      default: currentConfig.registry.url,
    },
    {
      type: 'number',
      name: 'cacheTtl',
      message: 'Cache TTL (seconds):',
      default: currentConfig.registry.cacheTtl,
    },
    {
      type: 'list',
      name: 'defaultTarget',
      message: 'Default installation target:',
      choices: ['claude-code', 'codex', 'copilot'],
      default: currentConfig.install.target,
    },
    {
      type: 'input',
      name: 'installDirectory',
      message: 'Installation directory:',
      default: currentConfig.install.directory,
    },
    {
      type: 'list',
      name: 'logLevel',
      message: 'Logging level:',
      choices: ['debug', 'info', 'warn', 'error'],
      default: currentConfig.logging.level,
    },
  ]);

  const newConfig = {
    registry: {
      url: answers.registryUrl,
      cacheTtl: answers.cacheTtl,
    },
    install: {
      target: answers.defaultTarget,
      directory: answers.installDirectory,
    },
    logging: {
      level: answers.logLevel,
    },
  };

  await configService.saveConfig(newConfig);
  console.log(chalk.green('✅ Configuration updated'));
}
