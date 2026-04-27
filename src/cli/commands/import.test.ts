import * as fs from 'fs';
import { Command } from 'commander';
import { registerImportCommand } from './import';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

jest.mock('fs');
jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({ close: jest.fn() }),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockVault = vault as jest.Mocked<typeof vault>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerImportCommand(program);
  return program;
}

describe('import command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('API_KEY=abc123\nDB_URL=postgres://localhost');
    mockVault.readVaultFile.mockReturnValue({ environments: {}, version: 1 });
    mockVault.writeVaultFile.mockImplementation(() => {});
    mockCrypto.encrypt.mockResolvedValue('encrypted-payload');

    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(process.stdin, 'on').mockImplementation((event: any, cb: any) => {
      if (event === 'data') setTimeout(() => cb('\n'), 0);
      return process.stdin;
    });
  });

  it('should call writeVaultFile with encrypted environment data', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'import', '.env', '-e', 'staging']);
    expect(mockVault.writeVaultFile).toHaveBeenCalledTimes(1);
    const [, writtenVault] = mockVault.writeVaultFile.mock.calls[0];
    expect(writtenVault.environments['staging']).toBeDefined();
  });

  it('should exit with error if file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'envault', 'import', 'missing.env']))
      .rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with error if .env file has no valid pairs', async () => {
    mockFs.readFileSync.mockReturnValue('# just a comment\n\n');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'envault', 'import', '.env']))
      .rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
