import { Command } from 'commander';
import * as readline from 'readline';
import { decrypt } from '../../crypto';
import { readVaultFile } from '../../vault';
import { parseEnv } from '../../vault/envParser';

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

export const getCommand = new Command('get')
  .description('Get environment variables from a vault environment')
  .argument('<environment>', 'Target environment (e.g. production, staging)')
  .option('-k, --key <key>', 'Retrieve a specific key only')
  .option('-f, --file <path>', 'Path to vault file', '.envault')
  .option('--export', 'Output as export statements', false)
  .action(async (environment: string, options: { key?: string; file: string; export: boolean }) => {
    try {
      const vault = readVaultFile(options.file);
      if (!vault) {
        console.error('Error: No vault file found. Run `envault set` first.');
        process.exit(1);
      }

      const envEntry = vault.environments[environment];
      if (!envEntry) {
        console.error(`Error: Environment "${environment}" not found in vault.`);
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');
      const decrypted = await decrypt(envEntry.encrypted, password);
      const vars = parseEnv(decrypted);

      if (options.key) {
        if (!(options.key in vars)) {
          console.error(`Error: Key "${options.key}" not found in [${environment}].`);
          process.exit(1);
        }
        console.log(options.export ? `export ${options.key}=${vars[options.key]}` : vars[options.key]);
      } else {
        for (const [k, v] of Object.entries(vars)) {
          console.log(options.export ? `export ${k}=${v}` : `${k}=${v}`);
        }
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
