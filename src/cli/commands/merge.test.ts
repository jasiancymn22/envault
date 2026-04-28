import { Command } from 'commander';
import { registerMergeCommand } from './merge';
import * as vault from '../../vault';
import * as crypto from '../../crypto';
import * as envParser from '../../vault/envParser';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('./merge', () => ({
  ...jest.requireActual('./merge'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

describe('merge command', () => {
  const mockVault = {
    version: '1',
    environments: {
      development: { data: 'enc-dev', updatedAt: '2024-01-01T00:00:00Z' },
      production: { data: 'enc-prod', updatedAt: '2024-01-01T00:00:00Z' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vault.readVaultFile as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(mockVault)));
    (vault.writeVaultFile as jest.Mock).mockResolvedValue(undefined);
    (crypto.decrypt as jest.Mock).mockImplementation((data: string) => {
      if (data === 'enc-dev') return Promise.resolve('KEY1=val1\nKEY2=val2');
      if (data === 'enc-prod') return Promise.resolve('KEY1=prod1');
      return Promise.resolve('');
    });
    (crypto.encrypt as jest.Mock).mockResolvedValue('enc-merged');
  });

  it('merges source into target without overwrite by default', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'merge', 'development', 'production']);
    expect(vault.writeVaultFile).toHaveBeenCalled();
    const written = (vault.writeVaultFile as jest.Mock).mock.calls[0][1];
    expect(written.environments.production.data).toBe('enc-merged');
  });

  it('exits if source environment not found', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'merge', 'staging', 'production'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });

  it('exits if target environment not found', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'merge', 'development', 'staging'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
