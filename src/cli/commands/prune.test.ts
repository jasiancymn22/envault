import { Command } from 'commander';
import { registerPruneCommand } from './prune';
import * as vault from '../../vault';

jest.mock('../../vault');

const mockReadVaultFile = vault.readVaultFile as jest.Mock;
const mockWriteVaultFile = vault.writeVaultFile as jest.Mock;
const mockListEnvironments = vault.listEnvironments as jest.Mock;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPruneCommand(program);
  return program;
}

describe('prune command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports no empty environments when all envs have keys', async () => {
    const mockVault = {
      environments: {
        production: { data: { API_KEY: 'val' } },
      },
    };
    mockReadVaultFile.mockResolvedValue(mockVault);
    mockListEnvironments.mockReturnValue(['production']);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'prune', '--yes'], { from: 'user' });

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No empty environments'));
    expect(mockWriteVaultFile).not.toHaveBeenCalled();
  });

  it('prunes empty environments with --yes flag', async () => {
    const mockVault = {
      environments: {
        production: { data: { API_KEY: 'val' } },
        staging: { data: {} },
      },
    };
    mockReadVaultFile.mockResolvedValue(mockVault);
    mockListEnvironments.mockReturnValue(['production', 'staging']);
    mockWriteVaultFile.mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'prune', '--yes'], { from: 'user' });

    expect(mockWriteVaultFile).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Pruned 1'));
  });

  it('does not write in dry-run mode', async () => {
    const mockVault = {
      environments: {
        empty: { data: {} },
      },
    };
    mockReadVaultFile.mockResolvedValue(mockVault);
    mockListEnvironments.mockReturnValue(['empty']);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'prune', '--dry-run'], { from: 'user' });

    expect(mockWriteVaultFile).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
  });

  it('handles read errors gracefully', async () => {
    mockReadVaultFile.mockRejectedValue(new Error('File not found'));

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'prune', '--yes'], { from: 'user' })
    ).resolves.not.toThrow();

    expect(console.error).toHaveBeenCalledWith('Error:', 'File not found');
  });
});
