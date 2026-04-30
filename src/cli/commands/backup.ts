import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVaultFile } from '../../vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const ch = char.toString();
      if (ch === '\n' || ch === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        console.log();
        resolve(password);
      } else if (ch === '\u0003') {
        process.exit();
      } else {
        password += ch;
      }
    });
  });
}

export function generateBackupFilename(vaultPath: string): string {
  const base = path.basename(vaultPath, path.extname(vaultPath));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${base}.backup-${timestamp}.json`;
}

export function registerBackupCommand(program: Command): void {
  program
    .command('backup')
    .description('Create a backup of the vault file')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .option('-o, --output <dir>', 'Output directory for backup', '.')
    .option('--no-password', 'Skip password verification before backup')
    .action(async (options) => {
      try {
        const vaultPath = path.resolve(options.vault);

        if (!fs.existsSync(vaultPath)) {
          console.error(`Vault file not found: ${vaultPath}`);
          process.exit(1);
        }

        if (options.password !== false) {
          const password = await promptPassword('Enter vault password to verify: ');
          try {
            await readVaultFile(vaultPath, password);
          } catch {
            console.error('Invalid password. Backup aborted.');
            process.exit(1);
          }
        }

        const outputDir = path.resolve(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const backupFilename = generateBackupFilename(vaultPath);
        const backupPath = path.join(outputDir, backupFilename);

        fs.copyFileSync(vaultPath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      } catch (err) {
        console.error('Backup failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
