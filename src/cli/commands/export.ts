import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';
import { stringifyEnv } from '../../vault/envParser';

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

export function registerExportCommand(program: Command): void {
  program
    .command('export <environment>')
    .description('Export a decrypted .env file for the given environment')
    .option('-o, --output <file>', 'Output file path (defaults to .env.<environment>)')
    .option('-v, --vault <file>', 'Path to vault file', '.envault')
    .option('--stdout', 'Print to stdout instead of writing a file')
    .action(async (environment: string, options) => {
      try {
        const vault = readVaultFile(options.vault);

        if (!vault.environments[environment]) {
          console.error(`Error: environment "${environment}" not found in vault.`);
          process.exit(1);
        }

        const password = await promptPassword(`Password for "${environment}": `);

        if (!password) {
          console.error('Error: password cannot be empty.');
          process.exit(1);
        }

        let decrypted: string;
        try {
          decrypted = await decrypt(vault.environments[environment].data, password);
        } catch {
          console.error('Error: decryption failed. Wrong password?');
          process.exit(1);
        }

        if (options.stdout) {
          process.stdout.write(decrypted);
          return;
        }

        const outputPath = options.output || `.env.${environment}`;
        const resolved = path.resolve(process.cwd(), outputPath);
        fs.writeFileSync(resolved, decrypted, 'utf8');
        console.log(`Exported "${environment}" to ${resolved}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
