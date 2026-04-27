import { Command } from 'commander';
import { registerRotateCommand } from './rotate';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRotateCommand(program);
  return program;
}

const mockVaultData = {
  version: 1,
  environments: {
    production: {
      iv: 'aabbcc',
      salt: 'ddeeff',
      ciphertext: 'encrypted_data',
      authTag: 'tag123',
    },
  },
};

jest.mock('../../vault', () => ({
  readVaultFile: jest.fn(),
  writeVaultFile: jest.fn(),
}));

jest.mock('../../crypto', () => ({
  deriveKey: jest.fn(),
  decrypt: jest.fn(),
  encrypt: jest.fn(),
}));

jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((_prompt: string, cb: (ans: string) => void) => cb('secret')),
    close: jest.fn(),
  }),
}));

describe('rotate command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vault.readVaultFile as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(mockVaultData)));
    (vault.writeVaultFile as jest.Mock).mockResolvedValue(undefined);
    (crypto.deriveKey as jest.Mock).mockResolvedValue('mock-key');
    (crypto.decrypt as jest.Mock).mockResolvedValue('KEY=value');
    (crypto.encrypt as jest.Mock).mockResolvedValue({
      iv: 'newiv',
      salt: 'ddeeff',
      ciphertext: 'new_encrypted',
      authTag: 'newtag',
    });
  });

  it('should rotate passwords for all environments', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rotate']);
    expect(vault.writeVaultFile).toHaveBeenCalledTimes(1);
    expect(crypto.decrypt).toHaveBeenCalledTimes(1);
    expect(crypto.encrypt).toHaveBeenCalledTimes(1);
  });

  it('should print message when no environments exist', async () => {
    (vault.readVaultFile as jest.Mock).mockResolvedValue({ version: 1, environments: {} });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rotate']);
    expect(consoleSpy).toHaveBeenCalledWith('No environments found in vault.');
    consoleSpy.mockRestore();
  });

  it('should rotate only the specified environment', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rotate', '--env', 'production']);
    expect(crypto.decrypt).toHaveBeenCalledTimes(1);
    expect(vault.writeVaultFile).toHaveBeenCalledTimes(1);
  });
});
