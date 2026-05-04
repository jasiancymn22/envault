import { Command } from 'commander';
import * as fs from 'fs';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';
import { registerSyncCommand } from './sync';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSyncCommand(program);
  return program;
}

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('fs');

describe('sync command', () => {
  const mockVault = {
    version: '1.0',
    environments: {
      production: 'encrypted-blob',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue(mockVault);
    (cryptoModule.decrypt as jest.Mock).mockResolvedValue('KEY=value\nSECRET=abc');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
  });

  it('syncs environment to target file', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'sync', 'production', '.env.production', '--password', 'secret']);
    expect(cryptoModule.decrypt).toHaveBeenCalledWith('encrypted-blob', 'secret');
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.env.production'), 'KEY=value\nSECRET=abc', 'utf-8');
  });

  it('exits if environment not found', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'sync', 'staging', '.env', '--password', 'secret'])
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('does not write file on dry-run', async () => {
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'test', 'sync', 'production', '.env', '--password', 'secret', '--dry-run']);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
    consoleSpy.mockRestore();
  });

  it('exits on decrypt failure', async () => {
    (cryptoModule.decrypt as jest.Mock).mockRejectedValue(new Error('bad password'));
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'sync', 'production', '.env', '--password', 'wrong'])
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
