import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PublishService } from '../services/publish';
import { validateAgentFile, parseAgentFile } from '../utils/agentParser';

export const publishCommand = new Command('publish')
  .description('Publish agents to the registry')
  .argument('[agent-file]', 'agent file to publish (.md file)')
  .option('--batch [directory]', 'publish all agents in directory')
  .option('--update', 'update existing agent')
  .option('--validate', 'validate agent format only')
  .option('--dry-run', 'preview what would be published')
  .option('-y, --yes', 'skip confirmation prompts')
  .option('--author <author>', 'override author name')
  .option('--category <category>', 'override category')
  .action(async (agentFile, options) => {
    try {
      const publishService = new PublishService();

      // Batch publish mode
      if (options.batch) {
        await handleBatchPublish(publishService, options.batch, options);
        return;
      }

      // Single file publish mode
      if (!agentFile) {
        console.error(chalk.red('Error: Please specify an agent file to publish or use --batch option'));
        console.log(chalk.gray('Examples:'));
        console.log(chalk.gray('  agt publish my-agent.md'));
        console.log(chalk.gray('  agt publish --batch ./agents'));
        process.exit(1);
      }

      await handleSinglePublish(publishService, agentFile, options);
    } catch (error) {
      console.error(chalk.red('Publish failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function handleSinglePublish(publishService: PublishService, agentFile: string, options: any) {
  const spinner = ora('Validating agent file...').start();
  
  try {
    // Check if file exists
    if (!await fs.pathExists(agentFile)) {
      spinner.fail(`File not found: ${agentFile}`);
      return;
    }

    // Validate agent file
    const validation = await validateAgentFile(agentFile);
    if (!validation.isValid) {
      spinner.fail('Agent file validation failed');
      console.log(chalk.red('Validation errors:'));
      validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      return;
    }

    spinner.succeed('Agent file validated');

    // Parse agent metadata
    const agentData = await parseAgentFile(agentFile, options);
    
    if (options.validate) {
      console.log(chalk.green('✅ Agent file is valid'));
      console.log(chalk.cyan('Agent details:'));
      console.log(`  ID: ${agentData.id}`);
      console.log(`  Name: ${agentData.name}`);
      console.log(`  Author: ${agentData.author}`);
      console.log(`  Category: ${agentData.category}`);
      console.log(`  Version: ${agentData.version}`);
      return;
    }

    // Show preview
    console.log(chalk.cyan('\n📋 Publishing Preview:'));
    console.log(`  File: ${agentFile}`);
    console.log(`  ID: ${agentData.id}`);
    console.log(`  Name: ${agentData.name}`);
    console.log(`  Author: ${agentData.author}`);
    console.log(`  Category: ${agentData.category}`);
    console.log(`  Version: ${agentData.version}`);
    console.log(`  Compatibility: ${Object.keys(agentData.compatibility).join(', ')}`);

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run - no changes would be made'));
      return;
    }

    // Confirm publication
    if (!options.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Publish "${agentData.name}" to the registry?`,
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Publication cancelled'));
        return;
      }
    }

    // Publish agent
    const publishSpinner = ora('Publishing agent...').start();
    const result = await publishService.publishAgent(agentData, agentFile, options.update);
    publishSpinner.succeed(`Published ${chalk.green(agentData.name)}`);

    console.log(chalk.green('\n✅ Publication successful!'));
    console.log(chalk.gray(`Agent ID: ${result.id}`));
    console.log(chalk.gray(`Registry URL: ${result.registryUrl}`));
  } catch (error) {
    spinner.fail('Publication failed');
    throw error;
  }
}

async function handleBatchPublish(publishService: PublishService, directory: string | boolean, options: any) {
  const targetDir = directory === true ? '.' : (directory as string);
  
  if (!await fs.pathExists(targetDir)) {
    console.error(chalk.red(`Directory not found: ${targetDir}`));
    return;
  }

  const spinner = ora('Scanning for agent files...').start();
  
  // Find all .md files in directory
  const agentFiles = await findAgentFiles(targetDir);
  
  if (agentFiles.length === 0) {
    spinner.fail('No agent files found');
    console.log(chalk.yellow(`No .md files found in ${targetDir}`));
    return;
  }

  spinner.succeed(`Found ${agentFiles.length} agent file(s)`);

  // Validate all files first
  const validationSpinner = ora('Validating agent files...').start();
  const validFiles: string[] = [];
  const invalidFiles: string[] = [];

  for (const file of agentFiles) {
    try {
      const validation = await validateAgentFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
        console.log(chalk.red(`\nInvalid file: ${file}`));
        validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      }
    } catch (error) {
      invalidFiles.push(file);
      console.log(chalk.red(`\nError validating ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  validationSpinner.succeed(`${validFiles.length} valid, ${invalidFiles.length} invalid`);

  if (validFiles.length === 0) {
    console.log(chalk.red('No valid agent files to publish'));
    return;
  }

  // Show batch preview
  console.log(chalk.cyan('\n📋 Batch Publishing Preview:'));
  console.log(`  Directory: ${targetDir}`);
  console.log(`  Valid files: ${validFiles.length}`);
  console.log(`  Invalid files: ${invalidFiles.length}`);
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🔍 Dry run - listing files that would be published:'));
    for (const file of validFiles) {
      console.log(chalk.gray(`  • ${file}`));
    }
    return;
  }

  // Confirm batch publication
  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Publish ${validFiles.length} agent(s) to the registry?`,
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Batch publication cancelled'));
      return;
    }
  }

  // Publish all valid files
  let successCount = 0;
  let failCount = 0;

  for (const file of validFiles) {
    const fileSpinner = ora(`Publishing ${path.basename(file)}...`).start();
    
    try {
      const agentData = await parseAgentFile(file, options);
      await publishService.publishAgent(agentData, file, options.update);
      fileSpinner.succeed(`Published ${chalk.green(agentData.name)}`);
      successCount++;
    } catch (error) {
      fileSpinner.fail(`Failed to publish ${chalk.red(path.basename(file))}: ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  // Summary
  console.log(chalk.green(`\n✅ Batch publication complete!`));
  console.log(chalk.gray(`Successfully published: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`Failed to publish: ${failCount}`));
  }
}

async function findAgentFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip hidden directories and common non-agent directories
        if (!entry.name.startsWith('.') && 
            !['node_modules', 'dist', 'build', 'out'].includes(entry.name)) {
          await scanDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDir(directory);
  return files;
}

