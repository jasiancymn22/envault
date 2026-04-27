import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Command } from 'commander';
import { readVaultFile, writeVaultFile } from '../../vault';
import { encrypt } from '../../crypto';
import { parseEnv, mergeEnv } from '../../vault/envParser';

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

export function registerImportCommand(program: Command): void {
  program
    .command('import <envFile>')
    .description('Import a .env file into the vault for a given environment')
    .option('-e, --environment <env>', 'Target environment name', 'development')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .option('--merge', 'Merge with existing keys instead of overwriting', false)
    .action(async (envFile: string, options) => {
      try {
        const filePath = path.resolve(envFile);
        if (!fs.existsSync(filePath)) {
          console.error(`Error: File not found: ${filePath}`);
          process.exit(1);
        }

        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseEnv(rawContent);

        if (Object.keys(parsed).length === 0) {
          console.error('Error: No valid key-value pairs found in the file.');
          process.exit(1);
        }

        const password = await promptPassword('Enter vault password: ');
        const vault = readVaultFile(options.vault);

        const existing = vault.environments[options.environment];
        const finalEnv = options.merge && existing
          ? mergeEnv(existing.plaintext ?? {}, parsed)
          : parsed;

        const encrypted = await encrypt(JSON.stringify(finalEnv), password);
        vault.environments[options.environment] = { encrypted };
        writeVaultFile(options.vault, vault);

        console.log(`Imported ${Object.keys(finalEnv).length} key(s) into environment "${options.environment}".`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
