import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigService } from '../services/config';

const ENVIRONMENTS = {
  local: 'http://localhost:3000',
  production: 'https://www.agthub.org',
  staging: 'https://agthub-staging.vercel.app', // 如果有staging环境
};

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .action(async () => {
    const configService = ConfigService.getInstance();
    await showConfig(configService);
  });

// 添加子命令
configCommand
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    const configService = ConfigService.getInstance();
    await showConfig(configService);
  });

configCommand
  .command('set-url <url>')
  .description('Set AGTHub API URL')
  .action(async (url: string) => {
    const configService = ConfigService.getInstance();
    await setApiUrl(configService, url);
  });

configCommand
  .command('use-env <environment>')
  .description('Switch to predefined environment (local, production, staging)')
  .action(async (environment: string) => {
    const configService = ConfigService.getInstance();
    await useEnvironment(configService, environment);
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const configService = ConfigService.getInstance();
    await resetConfig(configService);
  });

configCommand
  .command('edit')
  .description('Interactively edit configuration')
  .action(async () => {
    const configService = ConfigService.getInstance();
    await editConfig(configService);
  });

async function showConfig(configService: ConfigService) {
  const config = await configService.getConfig();
  const configPath = configService.getConfigPath();
  const apiUrl = configService.get('apiUrl') || 'https://www.agthub.org';
  const currentEnv = getCurrentEnvironment(apiUrl);
  
  console.log(chalk.cyan('\n📋 Current Configuration:'));
  console.log(chalk.gray(`Config file: ${configPath}\n`));
  
  console.log(chalk.yellow('🌐 AGTHub API:'));
  console.log(`  URL: ${chalk.green(apiUrl)}`);
  console.log(`  Environment: ${chalk.cyan(currentEnv || 'custom')}\n`);
  
  const email = configService.get('email');
  const userName = configService.get('userName');
  const token = configService.get('token');
  
  if (email) {
    console.log(chalk.yellow('👤 Authentication:'));
    console.log(`  Email: ${chalk.green(email)}`);
    if (userName) console.log(`  Name: ${chalk.green(userName)}`);
    console.log(`  Logged in: ${token ? chalk.green('✓ Yes') : chalk.red('✗ No')}\n`);
  }
  
  console.log(chalk.yellow('📦 Registry:'));
  console.log(`  URL: ${config.registry.url}`);
  console.log(`  Cache TTL: ${config.registry.cacheTtl}s\n`);
  
  console.log(chalk.yellow('📁 Installation:'));
  console.log(`  Default target: ${config.install.target}`);
  console.log(`  Directory: ${config.install.directory}\n`);
  
  console.log(chalk.yellow('📝 Logging:'));
  console.log(`  Level: ${config.logging.level}\n`);
  
  console.log(chalk.gray('Available commands:'));
  console.log(chalk.gray('  agt config set-url <url>           - Set custom API URL'));
  console.log(chalk.gray('  agt config use-env <environment>   - Switch environment (local/production/staging)'));
  console.log(chalk.gray('  agt config reset                   - Reset to defaults'));
}

function getCurrentEnvironment(apiUrl: string): string | null {
  for (const [env, url] of Object.entries(ENVIRONMENTS)) {
    if (url === apiUrl) {
      return env;
    }
  }
  return null;
}

async function setApiUrl(configService: ConfigService, url: string) {
  try {
    // Validate URL
    new URL(url);
    
    configService.set('apiUrl', url);
    configService.save();
    
    const currentEnv = getCurrentEnvironment(url);
    
    console.log(chalk.green('✅ API URL updated successfully'));
    console.log(chalk.gray('  URL:'), chalk.cyan(url));
    if (currentEnv) {
      console.log(chalk.gray('  Environment:'), chalk.cyan(currentEnv));
    }
    console.log(chalk.gray('\n💡 Tip: Use'), chalk.yellow('agt login'), chalk.gray('to authenticate with the new URL'));
  } catch (error) {
    console.error(chalk.red('❌ Invalid URL format'));
    console.log(chalk.gray('  Example:'), chalk.cyan('agt config set-url https://your-domain.com'));
    process.exit(1);
  }
}

async function useEnvironment(configService: ConfigService, environment: string) {
  const url = ENVIRONMENTS[environment as keyof typeof ENVIRONMENTS];
  
  if (!url) {
    console.error(chalk.red('❌ Unknown environment:'), environment);
    console.log(chalk.gray('\nAvailable environments:'));
    Object.entries(ENVIRONMENTS).forEach(([env, envUrl]) => {
      console.log(chalk.cyan(`  ${env.padEnd(12)}`), chalk.gray(envUrl));
    });
    process.exit(1);
  }
  
  configService.set('apiUrl', url);
  configService.save();
  
  console.log(chalk.green('✅ Switched to environment:'), chalk.cyan(environment));
  console.log(chalk.gray('  URL:'), chalk.cyan(url));
  console.log(chalk.gray('\n💡 Tip: Use'), chalk.yellow('agt login'), chalk.gray('to authenticate with the new environment'));
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
  const currentApiUrl = configService.get('apiUrl') || 'https://www.agthub.org';
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: 'AGTHub API URL:',
      default: currentApiUrl,
      validate: (input: string) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
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
    apiUrl: answers.apiUrl,
  };

  await configService.saveConfig(newConfig);
  console.log(chalk.green('✅ Configuration updated'));
  
  const currentEnv = getCurrentEnvironment(answers.apiUrl);
  if (currentEnv) {
    console.log(chalk.gray('  Environment:'), chalk.cyan(currentEnv));
  }
}
