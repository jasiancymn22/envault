import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import { readVaultFile, writeVaultFile } from '../../vault/vault';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
} from '../../vault/snapshot';
import { decrypt, encrypt, deriveKey } from '../../crypto';

const SNAPSHOT_DIR = '.envault-snapshots';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerSnapshotCommand(program: Command): void {
  const snap = program.command('snapshot').description('Manage vault snapshots');

  snap
    .command('save [label]')
    .description('Save a snapshot of the current vault state')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action(async (label: string | undefined, opts) => {
      const vault = readVaultFile(opts.file);
      const snapshot = createSnapshot(vault, label);
      saveSnapshot(path.resolve(SNAPSHOT_DIR), snapshot);
      console.log(`Snapshot saved: ${snapshot.id}${label ? ` (${label})` : ''}`);
    });

  snap
    .command('list')
    .description('List all saved snapshots')
    .action(() => {
      const snapshots = listSnapshots(path.resolve(SNAPSHOT_DIR));
      if (snapshots.length === 0) {
        console.log('No snapshots found.');
        return;
      }
      snapshots.forEach((s) => {
        const label = s.label ? ` — ${s.label}` : '';
        console.log(`${s.id}  ${s.timestamp}${label}`);
      });
    });

  snap
    .command('restore <id>')
    .description('Restore vault from a snapshot')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action(async (id: string, opts) => {
      const snapshot = loadSnapshot(path.resolve(SNAPSHOT_DIR), id);
      writeVaultFile(opts.file, snapshot.vault);
      console.log(`Vault restored from snapshot ${id}.`);
    });

  snap
    .command('delete <id>')
    .description('Delete a snapshot by id')
    .action((id: string) => {
      deleteSnapshot(path.resolve(SNAPSHOT_DIR), id);
      console.log(`Snapshot ${id} deleted.`);
    });
}
