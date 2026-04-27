import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile, removeEntry } from '../../vault';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(`${message} [y/N] `);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export function registerRemoveCommand(program: Command): void {
  program
    .command('remove <environment> [key]')
    .alias('rm')
    .description('Remove an environment or a specific key from the vault')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .option('-f, --force', 'Skip confirmation prompt', false)
    .action(async (environment: string, key: string | undefined, options: { vault: string; force: boolean }) => {
      try {
        const vault = readVaultFile(options.vault);

        if (!vault.environments[environment]) {
          console.error(`Environment "${environment}" not found in vault.`);
          process.exit(1);
        }

        const target = key ? `key "${key}" from environment "${environment}"` : `environment "${environment}"`;

        if (!options.force) {
          const confirmed = await promptConfirm(`Are you sure you want to remove ${target}?`);
          if (!confirmed) {
            console.log('Operation cancelled.');
            return;
          }
        }

        const password = await promptPassword('Enter vault password: ');

        const updatedVault = removeEntry(vault, environment, password, key);
        writeVaultFile(options.vault, updatedVault);

        if (key) {
          console.log(`Removed key "${key}" from environment "${environment}".`);
        } else {
          console.log(`Removed environment "${environment}" from vault.`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
