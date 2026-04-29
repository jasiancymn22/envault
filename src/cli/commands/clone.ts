import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char: Buffer) => {
      const c = char.toString();
      if (c === '\r' || c === '\n') {
        process.stdin.setRawMode?.(false);
        process.stderr.write('\n');
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

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <source-env> <target-env>')
    .description('Clone an environment to a new environment name')
    .option('-f, --vault-file <path>', 'Path to vault file', '.envault')
    .action(async (sourceEnv: string, targetEnv: string, options: { vaultFile: string }) => {
      try {
        const vault = readVaultFile(options.vaultFile);

        if (!vault.environments[sourceEnv]) {
          console.error(`Error: Environment "${sourceEnv}" does not exist.`);
          process.exit(1);
        }

        if (vault.environments[targetEnv]) {
          console.error(`Error: Environment "${targetEnv}" already exists.`);
          process.exit(1);
        }

        const password = await promptPassword(`Password for "${sourceEnv}": `);

        const { decrypt, encrypt, deriveKey, serializePayload, deserializePayload } = await import('../../crypto');
        const sourceEntry = vault.environments[sourceEnv];
        const keyMaterial = await deriveKey(password, Buffer.from(sourceEntry.salt, 'hex'));
        const decrypted = await decrypt(deserializePayload(sourceEntry.data), keyMaterial);

        const newSalt = Buffer.from(crypto.getRandomValues(new Uint8Array(16)));
        const newKey = await deriveKey(password, newSalt);
        const encrypted = await encrypt(decrypted, newKey);

        vault.environments[targetEnv] = {
          salt: newSalt.toString('hex'),
          data: serializePayload(encrypted),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        writeVaultFile(options.vaultFile, vault);
        console.log(`Environment "${sourceEnv}" cloned to "${targetEnv}" successfully.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
