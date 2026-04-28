import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt } from '../../crypto';
import { parseEnv, stringifyEnv, mergeEnv } from '../../vault/envParser';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <source> <target>')
    .description('Merge variables from source environment into target environment')
    .option('-f, --file <path>', 'vault file path', '.envault')
    .option('--overwrite', 'overwrite existing keys in target', false)
    .action(async (source: string, target: string, options) => {
      try {
        const vault = await readVaultFile(options.file);

        if (!vault.environments[source]) {
          console.error(`Source environment "${source}" not found.`);
          process.exit(1);
        }

        if (!vault.environments[target]) {
          console.error(`Target environment "${target}" not found.`);
          process.exit(1);
        }

        const password = await promptPassword('Enter vault password: ');

        const sourceDecrypted = await decrypt(vault.environments[source].data, password);
        const targetDecrypted = await decrypt(vault.environments[target].data, password);

        const sourceEnv = parseEnv(sourceDecrypted);
        const targetEnv = parseEnv(targetDecrypted);

        const merged = mergeEnv(targetEnv, sourceEnv, options.overwrite);
        const mergedString = stringifyEnv(merged);

        vault.environments[target].data = await encrypt(mergedString, password);
        vault.environments[target].updatedAt = new Date().toISOString();

        await writeVaultFile(options.file, vault);

        const addedKeys = Object.keys(sourceEnv).filter(
          (k) => !(k in targetEnv) || options.overwrite
        );
        console.log(`Merged ${addedKeys.length} key(s) from "${source}" into "${target}".`);
      } catch (err: any) {
        console.error('Merge failed:', err.message);
        process.exit(1);
      }
    });
}
