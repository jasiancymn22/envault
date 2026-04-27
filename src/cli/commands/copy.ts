import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { decrypt, encrypt } from '../../crypto';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <source-env> <dest-env>')
    .description('Copy all keys from one environment to another')
    .option('-f, --file <path>', 'vault file path', '.envault')
    .option('--overwrite', 'overwrite existing keys in destination', false)
    .action(async (sourceEnv: string, destEnv: string, options) => {
      try {
        const vault = await readVaultFile(options.file);

        if (!vault.environments[sourceEnv]) {
          console.error(`Error: environment "${sourceEnv}" does not exist.`);
          process.exit(1);
        }

        const password = await promptPassword(`Password for "${sourceEnv}": `);
        const sourceData = await decrypt(vault.environments[sourceEnv], password);

        let destPassword: string;
        let destData: string = '';

        if (vault.environments[destEnv]) {
          destPassword = await promptPassword(`Password for "${destEnv}": `);
          destData = await decrypt(vault.environments[destEnv], destPassword);
        } else {
          destPassword = await promptPassword(`New password for "${destEnv}": `);
        }

        const sourceLines = sourceData.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
        const destLines = destData ? destData.split('\n') : [];

        const destKeys = new Set(
          destLines
            .filter((l) => l.includes('='))
            .map((l) => l.split('=')[0].trim())
        );

        const linesToAdd = sourceLines.filter((line) => {
          const key = line.split('=')[0].trim();
          return options.overwrite || !destKeys.has(key);
        });

        const mergedLines = options.overwrite
          ? [
              ...destLines.filter((l) => {
                if (!l.includes('=')) return true;
                const key = l.split('=')[0].trim();
                return !new Set(linesToAdd.map((sl) => sl.split('=')[0].trim())).has(key);
              }),
              ...linesToAdd,
            ]
          : [...destLines, ...linesToAdd];

        const merged = mergedLines.join('\n').trim();
        vault.environments[destEnv] = await encrypt(merged, destPassword);
        await writeVaultFile(options.file, vault);

        console.log(
          `Copied ${linesToAdd.length} key(s) from "${sourceEnv}" to "${destEnv}".`
        );
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
