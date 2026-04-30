import { Command } from 'commander';
import { registerShareCommand } from './share';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';
import * as fs from 'fs';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerShareCommand(program);
  return program;
}

describe('share command', () => {
  const mockVault = {
    version: '1',
    environments: {
      production: { data: 'encrypted-data', updatedAt: '2024-01-01T00:00:00.000Z' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  });

  it('should register share and share-import commands', () => {
    const program = buildProgram();
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain('share');
    expect(commands).toContain('share-import');
  });

  it('should exit if environment not found during share', async () => {
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue({
      version: '1',
      environments: {},
    });

    const program = buildProgram();
    const shareCmd = program.commands.find((c) => c.name() === 'share')!;

    await expect(
      shareCmd.parseAsync(['node', 'test', 'nonexistent', 'out.json'])
    ).rejects.toThrow();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should write share file on successful share', async () => {
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue(mockVault);
    (cryptoModule.decrypt as jest.Mock).mockResolvedValue('KEY=value\n');
    (cryptoModule.encrypt as jest.Mock).mockResolvedValue('share-encrypted-data');

    const promptSpy = jest
      .spyOn(require('./share'), 'promptPassword')
      .mockResolvedValueOnce('vault-pass')
      .mockResolvedValueOnce('share-pass')
      .mockResolvedValueOnce('share-pass');

    const program = buildProgram();
    const shareCmd = program.commands.find((c) => c.name() === 'share')!;

    await shareCmd.parseAsync(['node', 'test', 'production', 'out.json']);

    expect(cryptoModule.decrypt).toHaveBeenCalledWith('encrypted-data', 'vault-pass');
    expect(cryptoModule.encrypt).toHaveBeenCalledWith('KEY=value\n', 'share-pass');
    expect(fs.writeFileSync).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('should exit when share passwords do not match', async () => {
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue(mockVault);
    (cryptoModule.decrypt as jest.Mock).mockResolvedValue('KEY=value\n');

    const promptSpy = jest
      .spyOn(require('./share'), 'promptPassword')
      .mockResolvedValueOnce('vault-pass')
      .mockResolvedValueOnce('share-pass')
      .mockResolvedValueOnce('different-pass');

    const program = buildProgram();
    const shareCmd = program.commands.find((c) => c.name() === 'share')!;

    await expect(
      shareCmd.parseAsync(['node', 'test', 'production', 'out.json'])
    ).rejects.toThrow();

    expect(process.exit).toHaveBeenCalledWith(1);
    promptSpy.mockRestore();
  });
});
