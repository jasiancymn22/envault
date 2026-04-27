import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt, deriveKey } from '../../crypto';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerRotateCommand(program: Command): void {
  program
    .command('rotate')
    .description('Re-encrypt all vault entries with a new password')
    .option('-e, --env <environment>', 'rotate a specific environment only')
    .action(async (options) => {
      try {
        const vault = await readVaultFile();

        if (Object.keys(vault.environments).length === 0) {
          console.log('No environments found in vault.');
          return;
        }

        const oldPassword = await promptPassword('Enter current password: ');
        const newPassword = await promptPassword('Enter new password: ');
        const confirmPassword = await promptPassword('Confirm new password: ');

        if (newPassword !== confirmPassword) {
          console.error('Error: Passwords do not match.');
          process.exit(1);
        }

        const envsToRotate = options.env
          ? [options.env]
          : Object.keys(vault.environments);

        let rotatedCount = 0;

        for (const envName of envsToRotate) {
          if (!vault.environments[envName]) {
            console.warn(`Warning: Environment "${envName}" not found, skipping.`);
            continue;
          }

          const entry = vault.environments[envName];

          try {
            const oldKey = await deriveKey(oldPassword, Buffer.from(entry.salt, 'hex'));
            const decrypted = await decrypt(entry, oldKey);
            const salt = Buffer.from(entry.salt, 'hex');
            const newKey = await deriveKey(newPassword, salt);
            const reEncrypted = await encrypt(decrypted, newKey, salt);
            vault.environments[envName] = reEncrypted;
            rotatedCount++;
          } catch {
            console.error(`Error: Failed to decrypt environment "${envName}". Wrong password?`);
            process.exit(1);
          }
        }

        await writeVaultFile(vault);
        console.log(`Successfully rotated password for ${rotatedCount} environment(s).`);
      } catch (err) {
        console.error('Error rotating password:', (err as Error).message);
        process.exit(1);
      }
    });
}
