import { Command } from 'commander';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char: Buffer) => {
      const c = char.toString();
      if (c === '\r' || c === '\n') {
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

export function registerSearchCommand(program: Command): void {
  program
    .command('search <pattern>')
    .description('Search for keys matching a pattern across environments')
    .option('-f, --vault-file <file>', 'Path to vault file', '.envault')
    .option('-e, --env <environment>', 'Limit search to a specific environment')
    .option('-v, --values', 'Also search in decrypted values (requires password)')
    .action(async (pattern: string, options) => {
      try {
        const vault = readVaultFile(options.vaultFile);
        const regex = new RegExp(pattern, 'i');
        const environments = options.env
          ? [options.env]
          : Object.keys(vault.environments);

        let password: string | undefined;
        if (options.values) {
          password = await promptPassword('Enter password: ');
        }

        let found = false;
        for (const env of environments) {
          const envData = vault.environments[env];
          if (!envData) {
            console.warn(`Environment "${env}" not found.`);
            continue;
          }

          const matchingKeys: string[] = [];

          for (const key of Object.keys(envData.entries)) {
            if (regex.test(key)) {
              matchingKeys.push(key);
              continue;
            }
            if (options.values && password) {
              try {
                const decrypted = await decrypt(envData.entries[key], password);
                if (regex.test(decrypted)) {
                  matchingKeys.push(`${key} (matched in value)`);
                }
              } catch {
                // skip keys that fail to decrypt
              }
            }
          }

          if (matchingKeys.length > 0) {
            found = true;
            console.log(`\n[${env}]`);
            matchingKeys.forEach((k) => console.log(`  ${k}`));
          }
        }

        if (!found) {
          console.log(`No matches found for pattern: "${pattern}"`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
