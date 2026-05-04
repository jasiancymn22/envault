import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt } from '../../crypto';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char: Buffer) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerSyncCommand(program: Command): void {
  program
    .command('sync <environment> <targetFile>')
    .description('Sync a vault environment to a local .env file')
    .option('-p, --password <password>', 'vault password')
    .option('--vault <path>', 'path to vault file', '.envault')
    .option('--dry-run', 'preview changes without writing')
    .action(async (environment: string, targetFile: string, options) => {
      try {
        const vaultPath = path.resolve(options.vault);
        const vault = readVaultFile(vaultPath);

        if (!vault.environments[environment]) {
          console.error(`Environment "${environment}" not found in vault.`);
          process.exit(1);
        }

        const password = options.password || await promptPassword('Enter vault password: ');
        const encrypted = vault.environments[environment];
        const decrypted = await decrypt(encrypted, password);

        if (options.dryRun) {
          console.log(`[dry-run] Would write to: ${targetFile}`);
          console.log(decrypted);
          return;
        }

        const resolvedTarget = path.resolve(targetFile);
        fs.writeFileSync(resolvedTarget, decrypted, 'utf-8');
        console.log(`Synced environment "${environment}" to ${resolvedTarget}`);
      } catch (err: any) {
        console.error('Sync failed:', err.message);
        process.exit(1);
      }
    });
}
