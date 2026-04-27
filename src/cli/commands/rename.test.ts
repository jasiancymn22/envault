import { Command } from 'commander';
import { registerRenameCommand } from './rename';
import * as vault from '../../vault';

jest.mock('../../vault');

const mockedReadVaultFile = vault.readVaultFile as jest.MockedFunction<typeof vault.readVaultFile>;
const mockedWriteVaultFile = vault.writeVaultFile as jest.MockedFunction<typeof vault.writeVaultFile>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRenameCommand(program);
  return program;
}

describe('rename command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renames an existing environment to a new name', async () => {
    const fakeVault: any = {
      version: 1,
      environments: {
        staging: { iv: 'abc', ciphertext: 'xyz', salt: 'salt1' },
      },
    };
    mockedReadVaultFile.mockResolvedValue(fakeVault);
    mockedWriteVaultFile.mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rename', 'staging', 'production']);

    expect(mockedWriteVaultFile).toHaveBeenCalledWith(
      '.envault',
      expect.objectContaining({
        environments: expect.objectContaining({
          production: { iv: 'abc', ciphertext: 'xyz', salt: 'salt1' },
        }),
      })
    );
    expect(fakeVault.environments['staging']).toBeUndefined();
  });

  it('exits with error if old environment does not exist', async () => {
    const fakeVault: any = { version: 1, environments: {} };
    mockedReadVaultFile.mockResolvedValue(fakeVault);

    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

    await expect(
      program.parseAsync(['node', 'test', 'rename', 'nonexistent', 'newname'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits with error if new environment already exists', async () => {
    const fakeVault: any = {
      version: 1,
      environments: {
        staging: { iv: 'abc', ciphertext: 'xyz', salt: 'salt1' },
        production: { iv: 'def', ciphertext: 'uvw', salt: 'salt2' },
      },
    };
    mockedReadVaultFile.mockResolvedValue(fakeVault);

    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

    await expect(
      program.parseAsync(['node', 'test', 'rename', 'staging', 'production'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
