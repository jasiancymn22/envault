import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
} from './snapshot';
import { VaultFile } from './vault';

const mockVault: VaultFile = {
  version: 1,
  environments: {
    production: { iv: 'abc', data: 'encrypted' },
  },
};

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('createSnapshot', () => {
  it('creates a snapshot with id, timestamp, and vault copy', () => {
    const snap = createSnapshot(mockVault, 'before-deploy');
    expect(snap.id).toBeDefined();
    expect(snap.timestamp).toBeDefined();
    expect(snap.label).toBe('before-deploy');
    expect(snap.vault).toEqual(mockVault);
  });

  it('deep copies the vault', () => {
    const snap = createSnapshot(mockVault);
    snap.vault.environments['staging'] = { iv: 'x', data: 'y' };
    expect(mockVault.environments['staging']).toBeUndefined();
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  it('saves and loads a snapshot by id', () => {
    const snap = createSnapshot(mockVault, 'test');
    saveSnapshot(tmpDir, snap);
    const loaded = loadSnapshot(tmpDir, snap.id);
    expect(loaded).toEqual(snap);
  });

  it('throws when loading a non-existent snapshot', () => {
    expect(() => loadSnapshot(tmpDir, 'nonexistent')).toThrow("Snapshot 'nonexistent' not found.");
  });
});

describe('listSnapshots', () => {
  it('returns empty array when directory does not exist', () => {
    expect(listSnapshots('/nonexistent/path')).toEqual([]);
  });

  it('lists snapshots sorted by newest first', () => {
    const s1 = createSnapshot(mockVault, 'first');
    const s2 = createSnapshot(mockVault, 'second');
    saveSnapshot(tmpDir, s1);
    saveSnapshot(tmpDir, s2);
    const list = listSnapshots(tmpDir);
    expect(list.length).toBe(2);
    expect(new Date(list[0].timestamp) >= new Date(list[1].timestamp)).toBe(true);
  });
});

describe('deleteSnapshot', () => {
  it('deletes an existing snapshot', () => {
    const snap = createSnapshot(mockVault);
    saveSnapshot(tmpDir, snap);
    deleteSnapshot(tmpDir, snap.id);
    expect(listSnapshots(tmpDir).length).toBe(0);
  });

  it('throws when deleting a non-existent snapshot', () => {
    expect(() => deleteSnapshot(tmpDir, 'ghost')).toThrow("Snapshot 'ghost' not found.");
  });
});
