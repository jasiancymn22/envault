import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        console.log();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerShareCommand(program: Command): void {
  program
    .command('share <environment> <outputFile>')
    .description('Export an environment encrypted with a one-time share password')
    .option('-v, --vault <path>', 'path to vault file', '.envault')
    .action(async (environment: string, outputFile: string, options: { vault: string }) => {
      try {
        const vault = readVaultFile(options.vault);
        const env = vault.environments[environment];
        if (!env) {
          console.error(`Environment "${environment}" not found.`);
          process.exit(1);
        }

        const vaultPassword = await promptPassword('Vault password: ');
        const decrypted = await decrypt(env.data, vaultPassword);

        const sharePassword = await promptPassword('Share password (recipient will need this): ');
        const confirmPassword = await promptPassword('Confirm share password: ');

        if (sharePassword !== confirmPassword) {
          console.error('Passwords do not match.');
          process.exit(1);
        }

        const reEncrypted = await encrypt(decrypted, sharePassword);
        const sharePayload = JSON.stringify({
          environment,
          data: reEncrypted,
          createdAt: new Date().toISOString(),
          version: vault.version ?? '1',
        }, null, 2);

        fs.writeFileSync(outputFile, sharePayload, 'utf-8');
        console.log(`Shared environment "${environment}" written to ${outputFile}`);
        console.log('Send the file and the share password to your teammate separately.');
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  program
    .command('share-import <shareFile> <environment>')
    .description('Import a shared environment file into the vault')
    .option('-v, --vault <path>', 'path to vault file', '.envault')
    .action(async (shareFile: string, environment: string, options: { vault: string }) => {
      try {
        const raw = fs.readFileSync(shareFile, 'utf-8');
        const sharePayload = JSON.parse(raw);

        const sharePassword = await promptPassword('Share password: ');
        const decrypted = await decrypt(sharePayload.data, sharePassword);

        const vaultPassword = await promptPassword('Vault password: ');
        const reEncrypted = await encrypt(decrypted, vaultPassword);

        const vault = readVaultFile(options.vault);
        vault.environments[environment] = { data: reEncrypted, updatedAt: new Date().toISOString() };
        writeVaultFile(options.vault, vault);

        console.log(`Environment "${environment}" imported successfully from ${shareFile}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
