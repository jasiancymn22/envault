import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';

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

export function registerTagCommand(program: Command): void {
  program
    .command('tag <environment> [tags...]')
    .description('Add or list tags for an environment')
    .option('-r, --remove <tag>', 'Remove a specific tag from the environment')
    .option('-l, --list', 'List all tags for the environment')
    .action(async (environment: string, tags: string[], options) => {
      try {
        const vault = await readVaultFile();

        if (!vault.environments[environment]) {
          console.error(`Environment "${environment}" does not exist.`);
          process.exit(1);
        }

        const env = vault.environments[environment];
        if (!env.tags) {
          env.tags = [];
        }

        if (options.list || (!tags.length && !options.remove)) {
          if (env.tags.length === 0) {
            console.log(`No tags for environment "${environment}".`);
          } else {
            console.log(`Tags for "${environment}": ${env.tags.join(', ')}`);
          }
          return;
        }

        if (options.remove) {
          const before = env.tags.length;
          env.tags = env.tags.filter((t: string) => t !== options.remove);
          if (env.tags.length < before) {
            await writeVaultFile(vault);
            console.log(`Removed tag "${options.remove}" from "${environment}".`);
          } else {
            console.log(`Tag "${options.remove}" not found on "${environment}".`);
          }
          return;
        }

        const added: string[] = [];
        for (const tag of tags) {
          if (!env.tags.includes(tag)) {
            env.tags.push(tag);
            added.push(tag);
          }
        }

        if (added.length > 0) {
          await writeVaultFile(vault);
          console.log(`Added tag(s) [${added.join(', ')}] to "${environment}".`);
        } else {
          console.log('No new tags added (all already exist).');
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
