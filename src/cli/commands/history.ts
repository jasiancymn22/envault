import { Command } from 'commander';
import { readVaultFile } from '../../vault';
import * as readline from 'readline';

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

export function formatHistoryEntry(
  index: number,
  entry: { timestamp: string; action: string; environment: string; key?: string }
): string {
  const date = new Date(entry.timestamp).toLocaleString();
  const keyPart = entry.key ? ` [${entry.key}]` : '';
  return `  ${String(index + 1).padStart(3, ' ')}. [${date}] ${entry.action.toUpperCase().padEnd(8)} ${entry.environment}${keyPart}`;
}

export function registerHistoryCommand(program: Command): void {
  program
    .command('history')
    .description('Show the change history of the vault')
    .option('-e, --env <environment>', 'Filter history by environment')
    .option('-n, --limit <number>', 'Limit number of entries shown', '20')
    .option('--no-password', 'Skip password prompt (for vaults without password)')
    .action(async (options) => {
      try {
        const password = options.password
          ? await promptPassword('Enter vault password: ')
          : '';

        const vault = await readVaultFile('.envault', password);

        let history: Array<{ timestamp: string; action: string; environment: string; key?: string }> =
          (vault as any).history ?? [];

        if (options.env) {
          history = history.filter((e) => e.environment === options.env);
        }

        const limit = parseInt(options.limit, 10);
        const entries = history.slice(-limit).reverse();

        if (entries.length === 0) {
          console.log('No history entries found.');
          return;
        }

        console.log(`\nVault History (last ${entries.length} entries):`);
        console.log('─'.repeat(60));
        entries.forEach((entry, i) => {
          console.log(formatHistoryEntry(i, entry));
        });
        console.log('─'.repeat(60));
      } catch (err: any) {
        console.error('Error reading vault history:', err.message);
        process.exit(1);
      }
    });
}
