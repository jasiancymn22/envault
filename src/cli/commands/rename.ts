import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <oldEnv> <newEnv>')
    .description('Rename an environment in the vault')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .action(async (oldEnv: string, newEnv: string, options: { file: string }) => {
      try {
        const vault = await readVaultFile(options.file);

        if (!vault.environments[oldEnv]) {
          console.error(`Error: Environment "${oldEnv}" does not exist.`);
          process.exit(1);
        }

        if (vault.environments[newEnv]) {
          console.error(`Error: Environment "${newEnv}" already exists.`);
          process.exit(1);
        }

        vault.environments[newEnv] = vault.environments[oldEnv];
        delete vault.environments[oldEnv];

        await writeVaultFile(options.file, vault);
        console.log(`Environment "${oldEnv}" renamed to "${newEnv}" successfully.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
