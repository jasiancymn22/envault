import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerCompressCommand(program: Command): void {
  program
    .command('compress <environment>')
    .description('Remove duplicate or empty keys from a vault environment')
    .option('-v, --verbose', 'Show removed keys')
    .action(async (environment: string, options: { verbose?: boolean }) => {
      try {
        const vault = await readVaultFile();

        if (!vault.environments[environment]) {
          console.error(`Environment "${environment}" not found.`);
          process.exit(1);
        }

        const password = await promptPassword(`Password for "${environment}": `);
        const encryptedData = vault.environments[environment];
        const decrypted = await decrypt(encryptedData, password);
        const lines = decrypted.split('\n');

        const seen = new Set<string>();
        const removed: string[] = [];
        const kept: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) {
            kept.push(line);
            continue;
          }
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) {
            removed.push(trimmed);
            continue;
          }
          const key = trimmed.substring(0, eqIdx).trim();
          const value = trimmed.substring(eqIdx + 1).trim();
          if (!key || seen.has(key)) {
            removed.push(trimmed);
            continue;
          }
          if (value === '' || value === '""' || value === "''") {
            removed.push(trimmed);
            continue;
          }
          seen.add(key);
          kept.push(line);
        }

        const compressed = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        const reEncrypted = await encrypt(compressed, password);
        vault.environments[environment] = reEncrypted;
        await writeVaultFile(vault);

        console.log(`✔ Compressed "${environment}": removed ${removed.length} key(s).`);
        if (options.verbose && removed.length > 0) {
          removed.forEach((r) => console.log(`  - ${r}`));
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
