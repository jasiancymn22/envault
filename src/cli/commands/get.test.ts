import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCommand } from './get';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

// Mock dependencies
vi.mock('../../vault');
vi.mock('../../crypto');
vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => ({
      question: vi.fn((_prompt: string, cb: (answer: string) => void) => cb('test-password')),
      close: vi.fn(),
    })),
  },
}));

describe('get command', () => {
  const mockVaultData = {
    version: 1,
    environments: {
      production: {
        iv: 'abc123',
        salt: 'def456',
        tag: 'ghi789',
        data: 'encrypted-data',
      },
    },
  };

  const mockDecryptedEnv = 'API_KEY=secret123\nDB_URL=postgres://localhost/db';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve and display a specific key from an environment', async () => {
    vi.mocked(vault.readVaultFile).mockResolvedValue(mockVaultData as any);
    vi.mocked(crypto.decrypt).mockResolvedValue(mockDecryptedEnv);
    vi.mocked(crypto.deserializePayload).mockReturnValue({
      iv: Buffer.from('iv'),
      salt: Buffer.from('salt'),
      tag: Buffer.from('tag'),
      data: Buffer.from('data'),
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await getCommand({ environment: 'production', key: 'API_KEY', vaultPath: '.envault' });

    expect(vault.readVaultFile).toHaveBeenCalledWith('.envault');
    expect(consoleSpy).toHaveBeenCalledWith('secret123');

    consoleSpy.mockRestore();
  });

  it('should print all keys when no specific key is requested', async () => {
    vi.mocked(vault.readVaultFile).mockResolvedValue(mockVaultData as any);
    vi.mocked(crypto.decrypt).mockResolvedValue(mockDecryptedEnv);
    vi.mocked(crypto.deserializePayload).mockReturnValue({
      iv: Buffer.from('iv'),
      salt: Buffer.from('salt'),
      tag: Buffer.from('tag'),
      data: Buffer.from('data'),
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await getCommand({ environment: 'production', vaultPath: '.envault' });

    expect(consoleSpy).toHaveBeenCalledWith(mockDecryptedEnv);

    consoleSpy.mockRestore();
  });

  it('should throw an error when environment does not exist', async () => {
    vi.mocked(vault.readVaultFile).mockResolvedValue({ version: 1, environments: {} } as any);

    await expect(
      getCommand({ environment: 'staging', key: 'API_KEY', vaultPath: '.envault' })
    ).rejects.toThrow("Environment 'staging' not found in vault");
  });

  it('should throw an error when key does not exist in environment', async () => {
    vi.mocked(vault.readVaultFile).mockResolvedValue(mockVaultData as any);
    vi.mocked(crypto.decrypt).mockResolvedValue(mockDecryptedEnv);
    vi.mocked(crypto.deserializePayload).mockReturnValue({
      iv: Buffer.from('iv'),
      salt: Buffer.from('salt'),
      tag: Buffer.from('tag'),
      data: Buffer.from('data'),
    });

    await expect(
      getCommand({ environment: 'production', key: 'NONEXISTENT_KEY', vaultPath: '.envault' })
    ).rejects.toThrow("Key 'NONEXISTENT_KEY' not found in environment 'production'");
  });

  it('should throw an error when decryption fails due to wrong password', async () => {
    vi.mocked(vault.readVaultFile).mockResolvedValue(mockVaultData as any);
    vi.mocked(crypto.deserializePayload).mockReturnValue({
      iv: Buffer.from('iv'),
      salt: Buffer.from('salt'),
      tag: Buffer.from('tag'),
      data: Buffer.from('data'),
    });
    vi.mocked(crypto.decrypt).mockRejectedValue(new Error('Decryption failed: invalid tag'));

    await expect(
      getCommand({ environment: 'production', key: 'API_KEY', vaultPath: '.envault' })
    ).rejects.toThrow('Decryption failed: invalid tag');
  });
});
