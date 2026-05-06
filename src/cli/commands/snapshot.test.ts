import { Command } from 'commander';
import { registerSnapshotCommand } from './snapshot';
import * as snapshotModule from '../../vault/snapshot';
import * as vaultModule from '../../vault/vault';

const mockVault = { version: 1, environments: { dev: { iv: 'iv', data: 'data' } } };

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommand(program);
  return program;
}

beforeEach(() => {
  jest.spyOn(vaultModule, 'readVaultFile').mockReturnValue(mockVault as any);
  jest.spyOn(vaultModule, 'writeVaultFile').mockImplementation(() => {});
  jest.spyOn(snapshotModule, 'saveSnapshot').mockImplementation(() => {});
  jest.spyOn(snapshotModule, 'deleteSnapshot').mockImplementation(() => {});
  jest.spyOn(snapshotModule, 'createSnapshot').mockReturnValue({
    id: 'abc123',
    timestamp: '2024-01-01T00:00:00.000Z',
    label: 'my-snap',
    vault: mockVault as any,
  });
  jest.spyOn(snapshotModule, 'loadSnapshot').mockReturnValue({
    id: 'abc123',
    timestamp: '2024-01-01T00:00:00.000Z',
    vault: mockVault as any,
  });
  jest.spyOn(snapshotModule, 'listSnapshots').mockReturnValue([]);
});

afterEach(() => jest.restoreAllMocks());

describe('snapshot save', () => {
  it('saves a snapshot and prints the id', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['snapshot', 'save', 'my-snap'], { from: 'user' });
    expect(snapshotModule.createSnapshot).toHaveBeenCalledWith(mockVault, 'my-snap');
    expect(snapshotModule.saveSnapshot).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
  });
});

describe('snapshot list', () => {
  it('prints no snapshots message when empty', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['snapshot', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No snapshots found.');
  });

  it('lists snapshots when present', async () => {
    jest.spyOn(snapshotModule, 'listSnapshots').mockReturnValue([
      { id: 'snap1', timestamp: '2024-01-01T00:00:00.000Z', label: 'first', vault: mockVault as any },
    ]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['snapshot', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('snap1'));
  });
});

describe('snapshot restore', () => {
  it('restores vault from snapshot', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['snapshot', 'restore', 'abc123'], { from: 'user' });
    expect(vaultModule.writeVaultFile).toHaveBeenCalledWith(expect.any(String), mockVault);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
  });
});

describe('snapshot delete', () => {
  it('deletes a snapshot by id', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['snapshot', 'delete', 'abc123'], { from: 'user' });
    expect(snapshotModule.deleteSnapshot).toHaveBeenCalledWith(expect.any(String), 'abc123');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
  });
});
