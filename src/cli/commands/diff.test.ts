import { Command } from 'commander';
import { registerDiffCommand } from './diff';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('./diff', () => ({
  ...jest.requireActual('./diff'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerDiffCommand(program);
  return program;
}

const mockVaultData = {
  version: 1,
  environments: {
    development: { data: 'enc-dev', createdAt: '', updatedAt: '' },
    production: { data: 'enc-prod', createdAt: '', updatedAt: '' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  (vault.readVaultFile as jest.Mock).mockResolvedValue(mockVaultData);
});

describe('diff command', () => {
  it('shows differences between two environments', async () => {
    (crypto.decrypt as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify({ KEY1: 'value1', SHARED: 'same' }))
      .mockResolvedValueOnce(JSON.stringify({ KEY2: 'value2', SHARED: 'same' }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', 'development', 'production']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('- KEY1=value1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('+ KEY2=value2'));
    consoleSpy.mockRestore();
  });

  it('reports no differences when envs are identical', async () => {
    (crypto.decrypt as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify({ KEY: 'value' }))
      .mockResolvedValueOnce(JSON.stringify({ KEY: 'value' }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', 'development', 'production']);

    expect(consoleSpy).toHaveBeenCalledWith('No differences found.');
    consoleSpy.mockRestore();
  });

  it('exits if environment not found', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'test', 'diff', 'staging', 'production'])
    ).rejects.toThrow('exit');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('staging'));
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
