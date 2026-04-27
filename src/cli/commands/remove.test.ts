import { Command } from 'commander';
import { registerRemoveCommand } from './remove';
import * as vault from '../../vault';

jest.mock('../../vault');
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((_prompt: string, cb: (answer: string) => void) => cb('y')),
    close: jest.fn(),
  })),
}));

const mockReadVaultFile = vault.readVaultFile as jest.MockedFunction<typeof vault.readVaultFile>;
const mockWriteVaultFile = vault.writeVaultFile as jest.MockedFunction<typeof vault.writeVaultFile>;
const mockRemoveEntry = vault.removeEntry as jest.MockedFunction<typeof vault.removeEntry>;

const mockVault = {
  version: 1,
  environments: {
    production: { iv: 'abc', salt: 'def', data: 'encrypted' },
  },
};

describe('registerRemoveCommand', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerRemoveCommand(program);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => { throw new Error(`process.exit: ${code}`); });
    mockReadVaultFile.mockReturnValue(mockVault as any);
    mockRemoveEntry.mockReturnValue(mockVault as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('removes an environment with --force flag', async () => {
    await program.parseAsync(['node', 'test', 'remove', 'production', '--force', '-v', '.envault']);
    expect(mockRemoveEntry).toHaveBeenCalledWith(mockVault, 'production', expect.any(String), undefined);
    expect(mockWriteVaultFile).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Removed environment "production" from vault.');
  });

  it('removes a specific key with --force flag', async () => {
    await program.parseAsync(['node', 'test', 'remove', 'production', 'API_KEY', '--force', '-v', '.envault']);
    expect(mockRemoveEntry).toHaveBeenCalledWith(mockVault, 'production', expect.any(String), 'API_KEY');
    expect(consoleLogSpy).toHaveBeenCalledWith('Removed key "API_KEY" from environment "production".');
  });

  it('exits with error when environment not found', async () => {
    await expect(
      program.parseAsync(['node', 'test', 'remove', 'staging', '--force'])
    ).rejects.toThrow('process.exit: 1');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Environment "staging" not found in vault.');
  });
});
