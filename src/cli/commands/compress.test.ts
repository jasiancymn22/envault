import { Command } from 'commander';
import { registerCompressCommand } from './compress';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCompressCommand(program);
  return program;
}

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('./compress', () => ({
  ...jest.requireActual('./compress'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

const mockReadVaultFile = vault.readVaultFile as jest.Mock;
const mockWriteVaultFile = vault.writeVaultFile as jest.Mock;
const mockDecrypt = crypto.decrypt as jest.Mock;
const mockEncrypt = crypto.encrypt as jest.Mock;

describe('compress command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteVaultFile.mockResolvedValue(undefined);
    mockEncrypt.mockResolvedValue('encrypted-result');
  });

  it('removes duplicate keys', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { production: 'enc' },
    });
    mockDecrypt.mockResolvedValue('KEY=value1\nKEY=value2\nOTHER=hello');

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'compress', 'production']);

    expect(mockEncrypt).toHaveBeenCalledWith('KEY=value1\nOTHER=hello', 'secret');
    expect(mockWriteVaultFile).toHaveBeenCalled();
  });

  it('removes empty-value keys', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { staging: 'enc' },
    });
    mockDecrypt.mockResolvedValue('KEY=\nVALID=yes');

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'compress', 'staging']);

    expect(mockEncrypt).toHaveBeenCalledWith('VALID=yes', 'secret');
  });

  it('exits with error when environment not found', async () => {
    mockReadVaultFile.mockResolvedValue({ environments: {} });

    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'test', 'compress', 'missing'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits with error on decryption failure', async () => {
    mockReadVaultFile.mockResolvedValue({ environments: { dev: 'enc' } });
    mockDecrypt.mockRejectedValue(new Error('bad password'));

    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'test', 'compress', 'dev'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
