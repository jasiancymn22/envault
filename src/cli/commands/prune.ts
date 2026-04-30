import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile, listEnvironments } from '../../vault';

export async function promptPassword(prompt: string): Promise<string> {
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

export function registerPruneCommand(program: Command): void {
  program
    .command('prune')
    .description('Remove environments that have no keys from the vault')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--dry-run', 'Show what would be removed without making changes')
    .action(async (options) => {
      try {
        const vault = await readVaultFile(options.file);
        const environments = listEnvironments(vault);

        const emptyEnvs = environments.filter((env) => {
          const envData = vault.environments[env];
          return !envData || Object.keys(envData.data || {}).length === 0;
        });

        if (emptyEnvs.length === 0) {
          console.log('No empty environments found. Nothing to prune.');
          return;
        }

        console.log(`Found ${emptyEnvs.length} empty environment(s): ${emptyEnvs.join(', ')}`);

        if (options.dryRun) {
          console.log('Dry run: no changes made.');
          return;
        }

        if (!options.yes) {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>((resolve) =>
            rl.question('Are you sure you want to prune these environments? (y/N) ', (a) => {
              rl.close();
              resolve(a);
            })
          );
          if (answer.toLowerCase() !== 'y') {
            console.log('Aborted.');
            return;
          }
        }

        for (const env of emptyEnvs) {
          delete vault.environments[env];
        }

        await writeVaultFile(options.file, vault);
        console.log(`Pruned ${emptyEnvs.length} empty environment(s).`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
