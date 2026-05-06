import * as fs from 'fs';
import * as path from 'path';
import { VaultFile } from './vault';

export interface Snapshot {
  id: string;
  timestamp: string;
  label?: string;
  vault: VaultFile;
}

export function createSnapshot(vault: VaultFile, label?: string): Snapshot {
  return {
    id: generateSnapshotId(),
    timestamp: new Date().toISOString(),
    label,
    vault: JSON.parse(JSON.stringify(vault)),
  };
}

export function saveSnapshot(snapshotDir: string, snapshot: Snapshot): void {
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  const filename = `${snapshot.id}.json`;
  fs.writeFileSync(path.join(snapshotDir, filename), JSON.stringify(snapshot, null, 2));
}

export function loadSnapshot(snapshotDir: string, id: string): Snapshot {
  const filepath = path.join(snapshotDir, `${id}.json`);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot '${id}' not found.`);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

export function listSnapshots(snapshotDir: string): Snapshot[] {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs
    .readdirSync(snapshotDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf-8')) as Snapshot)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function deleteSnapshot(snapshotDir: string, id: string): void {
  const filepath = path.join(snapshotDir, `${id}.json`);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot '${id}' not found.`);
  }
  fs.unlinkSync(filepath);
}

function generateSnapshotId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
