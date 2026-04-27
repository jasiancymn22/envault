import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';

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

export function registerDiffCommand(program: Command): void {
  program
    .command('diff <env1> <env2>')
    .description('Show differences between two environments in the vault')
    .option('-v, --vault <path>', 'path to vault file', '.envault')
    .action(async (env1: string, env2: string, options: { vault: string }) => {
      try {
        const vault = await readVaultFile(options.vault);

        if (!vault.environments[env1]) {
          console.error(`Environment "${env1}" not found in vault.`);
          process.exit(1);
        }
        if (!vault.environments[env2]) {
          console.error(`Environment "${env2}" not found in vault.`);
          process.exit(1);
        }

        const password = await promptPassword('Enter vault password: ');

        const data1 = await decrypt(vault.environments[env1].data, password);
        const data2 = await decrypt(vault.environments[env2].data, password);

        const keys1 = new Map(Object.entries(JSON.parse(data1)));
        const keys2 = new Map(Object.entries(JSON.parse(data2)));

        const allKeys = new Set([...keys1.keys(), ...keys2.keys()]);
        let hasDiff = false;

        console.log(`\nDiff: ${env1} → ${env2}\n`);
        for (const key of [...allKeys].sort()) {
          const v1 = keys1.get(key);
          const v2 = keys2.get(key);
          if (v1 === undefined) {
            console.log(`\x1b[32m+ ${key}=${v2}\x1b[0m`);
            hasDiff = true;
          } else if (v2 === undefined) {
            console.log(`\x1b[31m- ${key}=${v1}\x1b[0m`);
            hasDiff = true;
          } else if (v1 !== v2) {
            console.log(`\x1b[31m- ${key}=${v1}\x1b[0m`);
            console.log(`\x1b[32m+ ${key}=${v2}\x1b[0m`);
            hasDiff = true;
          }
        }

        if (!hasDiff) {
          console.log('No differences found.');
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
