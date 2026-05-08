import { Command } from 'commander';
import { registerSecretCommand } from './secret';
import * as vaultModule from '../../vault';
import * as secretModule from '../../vault/secret';
import * as readline from 'readline';

jest.mock('../../vault');
jest.mock('../../vault/secret');
jest.mock('readline');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSecretCommand(program);
  return program;
}

const mockVault = { secrets: [] };

beforeEach(() => {
  jest.clearAllMocks();
  (vaultModule.readVaultFile as jest.Mock).mockReturnValue({ ...mockVault, secrets: [] });
  (vaultModule.writeVaultFile as jest.Mock).mockImplementation(() => {});
  const rl = { question: jest.fn((_, cb) => cb('password123')), close: jest.fn() };
  (readline.createInterface as jest.Mock).mockReturnValue(rl);
});

describe('secret set', () => {
  it('encrypts and stores a new secret', async () => {
    const fakeEntry = { metadata: { key: 'DB_URL', environment: 'production' }, encryptedValue: 'enc' };
    (secretModule.encryptSecret as jest.Mock).mockResolvedValue(fakeEntry);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'secret', 'set', 'production', 'DB_URL', 'postgres://localhost']);
    expect(secretModule.encryptSecret).toHaveBeenCalledWith('DB_URL', 'postgres://localhost', 'production', 'password123', { tags: undefined, description: undefined });
    expect(vaultModule.writeVaultFile).toHaveBeenCalled();
  });

  it('stores tags when provided', async () => {
    const fakeEntry = { metadata: { key: 'API_KEY', environment: 'staging', tags: ['api'] }, encryptedValue: 'enc' };
    (secretModule.encryptSecret as jest.Mock).mockResolvedValue(fakeEntry);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'secret', 'set', 'staging', 'API_KEY', 'secret', '--tags', 'api,external']);
    expect(secretModule.encryptSecret).toHaveBeenCalledWith('API_KEY', 'secret', 'staging', 'password123', { tags: ['api', 'external'], description: undefined });
  });
});

describe('secret get', () => {
  it('decrypts and prints a secret', async () => {
    const fakeEntry = { metadata: { key: 'TOKEN', environment: 'production' }, encryptedValue: 'enc' };
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue({ secrets: [fakeEntry] });
    (secretModule.decryptSecret as jest.Mock).mockResolvedValue('my-token-value');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'secret', 'get', 'production', 'TOKEN']);
    expect(consoleSpy).toHaveBeenCalledWith('my-token-value');
    consoleSpy.mockRestore();
  });

  it('exits with error if secret not found', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'secret', 'get', 'production', 'MISSING'])).rejects.toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});

describe('secret search', () => {
  it('lists secrets matching a tag', () => {
    const entries = [
      { metadata: { key: 'A', environment: 'prod', tags: ['db'] }, encryptedValue: 'x' },
    ];
    (vaultModule.readVaultFile as jest.Mock).mockReturnValue({ secrets: entries });
    (secretModule.filterSecretsByTag as jest.Mock).mockReturnValue(entries);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['node', 'test', 'secret', 'search', 'db']);
    expect(secretModule.filterSecretsByTag).toHaveBeenCalledWith(entries, 'db');
    consoleSpy.mockRestore();
  });
});
