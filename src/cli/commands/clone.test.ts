import { Command } from 'commander';
import { registerCloneCommand } from './clone';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('./clone', () => ({
  ...jest.requireActual('./clone'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

describe('clone command', () => {
  const mockVault = {
    version: '1',
    environments: {
      production: {
        salt: 'aabbcc',
        data: 'encrypteddata',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vault.readVaultFile as jest.Mock).mockReturnValue(JSON.parse(JSON.stringify(mockVault)));
    (vault.writeVaultFile as jest.Mock).mockImplementation(() => {});
    (crypto.deriveKey as jest.Mock).mockResolvedValue('keyMaterial');
    (crypto.decrypt as jest.Mock).mockResolvedValue('KEY=value\nFOO=bar');
    (crypto.encrypt as jest.Mock).mockResolvedValue('newEncryptedPayload');
    (crypto.deserializePayload as jest.Mock).mockReturnValue({ iv: 'iv', ciphertext: 'ct', tag: 'tag' });
    (crypto.serializePayload as jest.Mock).mockReturnValue('serialized');
  });

  it('should exit with error if source environment does not exist', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'clone', 'nonexistent', 'staging'])
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should exit with error if target environment already exists', async () => {
    const vaultWithTwo = JSON.parse(JSON.stringify(mockVault));
    vaultWithTwo.environments.staging = { ...mockVault.environments.production };
    (vault.readVaultFile as jest.Mock).mockReturnValue(vaultWithTwo);
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'clone', 'production', 'staging'])
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should call writeVaultFile on successful clone', async () => {
    const program = buildProgram();
    const { promptPassword } = require('./clone');
    (promptPassword as jest.Mock).mockResolvedValue('secret');
    await program.parseAsync(['node', 'test', 'clone', 'production', 'staging']);
    expect(vault.writeVaultFile).toHaveBeenCalled();
  });
});
