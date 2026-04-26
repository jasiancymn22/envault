import { Command } from 'commander';
import * as readline from 'readline';
import { encrypt } from '../../crypto';
import { readVaultFile, writeVaultFile, createVault } from '../../vault';
import { parseEnv, mergeEnv } from '../../vault/envParser';

function promptPassword(prompt: string): Promise<string> {
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
        process.stdout.write('\n');
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export const setCommand = new Command('set')
  .description('Set one or more environment variables in a vault environment')
  .argument('<environment>', 'Target environment (e.g. production, staging)')
  .argument('<entries...>', 'KEY=VALUE pairs to set')
  .option('-f, --file <path>', 'Path to vault file', '.envault')
  .action(async (environment: string, entries: string[], options: { file: string }) => {
    try {
      const password = await promptPassword('Enter vault password: ');
      const newVars = parseEnv(entries.join('\n'));

      let vault = readVaultFile(options.file);
      if (!vault) {
        vault = createVault();
      }

      const envEntry = vault.environments[environment];
      let existing: Record<string, string> = {};

      if (envEntry) {
        const decrypted = await decrypt(envEntry.encrypted, password);
        existing = parseEnv(decrypted);
      }

      const merged = mergeEnv(existing, newVars);
      const plaintext = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('\n');
      const encrypted = await encrypt(plaintext, password);

      vault.environments[environment] = { encrypted, updatedAt: new Date().toISOString() };
      writeVaultFile(options.file, vault);

      console.log(`✓ Set ${Object.keys(newVars).length} variable(s) in [${environment}]`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
