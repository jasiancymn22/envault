import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';

const LOCK_FILE = '.envault.lock';

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

export function isVaultLocked(vaultPath: string): boolean {
  const lockPath = path.join(path.dirname(vaultPath), LOCK_FILE);
  return fs.existsSync(lockPath);
}

export function registerLockCommand(program: Command, vaultPath: string): void {
  program
    .command('lock')
    .description('Lock the vault to prevent accidental reads or writes')
    .action(() => {
      try {
        readVaultFile(vaultPath);
      } catch {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const lockPath = path.join(path.dirname(vaultPath), LOCK_FILE);
      if (fs.existsSync(lockPath)) {
        console.log('Vault is already locked.');
        return;
      }
      fs.writeFileSync(lockPath, new Date().toISOString(), 'utf-8');
      console.log('Vault locked successfully.');
    });

  program
    .command('unlock')
    .description('Unlock the vault')
    .action(async () => {
      const lockPath = path.join(path.dirname(vaultPath), LOCK_FILE);
      if (!fs.existsSync(lockPath)) {
        console.log('Vault is not locked.');
        return;
      }
      const password = await promptPassword('Master password: ');
      if (!password) {
        console.error('Password is required to unlock the vault.');
        process.exit(1);
      }
      try {
        readVaultFile(vaultPath);
        fs.unlinkSync(lockPath);
        console.log('Vault unlocked successfully.');
      } catch {
        console.error('Failed to unlock vault. Invalid password or corrupted vault.');
        process.exit(1);
      }
    });
}
