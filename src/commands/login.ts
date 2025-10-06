import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ConfigService } from '../services/config';
import axios from 'axios';

export const loginCommand = new Command('login')
  .description('Login to AGTHub to publish agents')
  .action(async () => {
    const config = ConfigService.getInstance();
    const apiUrl = config.get('apiUrl') || 'https://agthub-qexf.vercel.app';

    try {
      console.log(chalk.blue('🔐 AGTHub CLI Login\n'));

      // Ask for email
      const { email } = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Enter your email:',
          validate: (input) => {
            if (!input || !input.includes('@')) {
              return 'Please enter a valid email address';
            }
            return true;
          }
        }
      ]);

      // Send verification code
      const sendCodeSpinner = ora('Sending verification code...').start();
      
      try {
        await axios.post(`${apiUrl}/api/auth/send-code`, {
          email,
          type: 'login'
        });
        
        sendCodeSpinner.succeed('Verification code sent to your email');
      } catch (error: any) {
        sendCodeSpinner.fail('Failed to send verification code');
        
        if (error.response?.data?.error) {
          console.error(chalk.red(error.response.data.error));
        } else {
          console.error(chalk.red('Network error. Please check your internet connection.'));
        }
        return;
      }

      // Ask for verification code
      const { code } = await inquirer.prompt([
        {
          type: 'input',
          name: 'code',
          message: 'Enter the verification code from your email:',
          validate: (input) => {
            if (!input || input.length !== 6) {
              return 'Please enter the 6-digit code';
            }
            return true;
          }
        }
      ]);

      // Verify code and get CLI token
      const loginSpinner = ora('Logging in...').start();
      
      try {
        const response = await axios.post(`${apiUrl}/api/cli/login`, {
          email,
          code
        });

        const { token, expiresAt, user } = response.data;

        // Save token to config
        config.set('token', token);
        config.set('email', user.email);
        config.set('userName', user.name);
        config.save();

        loginSpinner.succeed('Login successful!');
        
        console.log(chalk.green('\n✓ Logged in as:'), chalk.cyan(user.email));
        console.log(chalk.green('✓ Token valid until:'), chalk.cyan(new Date(expiresAt).toLocaleDateString()));
        console.log(chalk.gray('\nYou can now publish agents using'), chalk.yellow('agt publish'));

      } catch (error: any) {
        loginSpinner.fail('Login failed');
        
        if (error.response?.data?.error) {
          console.error(chalk.red(error.response.data.error));
        } else {
          console.error(chalk.red('Failed to login. Please try again.'));
        }
      }

    } catch (error) {
      console.error(chalk.red('Login process interrupted'));
      process.exit(1);
    }
  });


