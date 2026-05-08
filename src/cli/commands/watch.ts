import { Command } from 'commander';
import * as readline from 'readline';
import { watchVault, formatWatchEvent } from '../../vault/watch';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';
import * as prompts from '@inquirer/prompts';

async function promptPassword(message: string): Promise<string> {
  return prompts.password({ message });
}

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch a vault file for changes and display updated keys')
    .argument('<vault-file>', 'path to the vault file')
    .option('-e, --env <environment>', 'environment to watch', 'default')
    .option('-d, --debounce <ms>', 'debounce delay in milliseconds', '300')
    .option('--no-decrypt', 'show change notifications only, skip decryption')
    .action(async (vaultFile: string, options) => {
      const debounceMs = parseInt(options.debounce, 10);
      let password: string | null = null;

      if (options.decrypt !== false) {
        password = await promptPassword('Master password (for decryption):');
      }

      console.log(`Watching ${vaultFile} for changes... (Ctrl+C to stop)`);

      const handle = watchVault(vaultFile, async (event) => {
        console.log('\n' + formatWatchEvent(event));

        if (password) {
          try {
            const vault = await readVaultFile(vaultFile);
            const envEntry = vault.environments[options.env];
            if (!envEntry) {
              console.log(`  Environment "${options.env}" not found.`);
              return;
            }
            const decrypted = await decrypt(envEntry.data, password);
            const lines = decrypted.split('\n').filter(Boolean);
            const keys = lines
              .map((l) => l.split('=')[0])
              .filter((k) => k && !k.startsWith('#'));
            console.log(`  Keys in "${options.env}": ${keys.join(', ')}`);
          } catch {
            console.error('  Failed to decrypt — wrong password or corrupted vault.');
          }
        }
      }, debounceMs);

      const rl = readline.createInterface({ input: process.stdin });
      rl.on('close', () => {
        handle.stop();
        console.log('\nWatch stopped.');
        process.exit(0);
      });

      process.on('SIGINT', () => {
        handle.stop();
        console.log('\nWatch stopped.');
        process.exit(0);
      });
    });
}
