import { Command } from 'commander';
import { registerExportCommand } from './export';
import * as vault from '../../vault';
import * as crypto from '../../crypto';
import * as fs from 'fs';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('fs');

const mockReadVaultFile = vault.readVaultFile as jest.Mock;
const mockDecrypt = crypto.decrypt as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;

const mockVault = {
  version: 1,
  environments: {
    production: {
      data: 'encrypted-payload',
    },
  },
};

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExportCommand(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
    throw new Error(`process.exit(${code})`);
  });
});

describe('export command', () => {
  it('writes decrypted env to file by default', async () => {
    mockReadVaultFile.mockReturnValue(mockVault);
    mockDecrypt.mockResolvedValue('API_KEY=secret\nDEBUG=false\n');

    jest.spyOn(require('readline'), 'createInterface').mockReturnValue({
      question: (_: string, cb: (a: string) => void) => cb('mypassword'),
      close: jest.fn(),
    });

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'export', 'production', '--stdout'], { from: 'user' });

    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-payload', 'mypassword');
  });

  it('exits with error if environment not found', async () => {
    mockReadVaultFile.mockReturnValue({ version: 1, environments: {} });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'export', 'staging'], { from: 'user' })
    ).rejects.toThrow('process.exit(1)');
  });

  it('exits with error if decryption fails', async () => {
    mockReadVaultFile.mockReturnValue(mockVault);
    mockDecrypt.mockRejectedValue(new Error('bad decrypt'));

    jest.spyOn(require('readline'), 'createInterface').mockReturnValue({
      question: (_: string, cb: (a: string) => void) => cb('wrongpassword'),
      close: jest.fn(),
    });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'export', 'production'], { from: 'user' })
    ).rejects.toThrow('process.exit(1)');
  });
});
