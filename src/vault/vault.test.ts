import {
  createVault,
  addEntry,
  getEntry,
  removeEntry,
  listEnvironments,
} from './vault';

const PASSPHRASE = 'test-secret-passphrase';
const ENV_CONTENT = 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=abc123';

describe('vault', () => {
  it('creates an empty vault', () => {
    const vault = createVault();
    expect(vault.version).toBe(1);
    expect(vault.entries).toEqual({});
  });

  it('adds an entry and retrieves it', async () => {
    let vault = createVault();
    vault = await addEntry(vault, 'production', ENV_CONTENT, PASSPHRASE);

    expect(listEnvironments(vault)).toContain('production');
    const decrypted = await getEntry(vault, 'production', PASSPHRASE);
    expect(decrypted).toBe(ENV_CONTENT);
  });

  it('throws when getting a non-existent environment', async () => {
    const vault = createVault();
    await expect(getEntry(vault, 'staging', PASSPHRASE)).rejects.toThrow(
      'Environment "staging" not found in vault'
    );
  });

  it('removes an entry', async () => {
    let vault = createVault();
    vault = await addEntry(vault, 'staging', ENV_CONTENT, PASSPHRASE);
    vault = removeEntry(vault, 'staging');
    expect(listEnvironments(vault)).not.toContain('staging');
  });

  it('throws when removing a non-existent environment', () => {
    const vault = createVault();
    expect(() => removeEntry(vault, 'dev')).toThrow(
      'Environment "dev" not found in vault'
    );
  });

  it('lists all environments', async () => {
    let vault = createVault();
    vault = await addEntry(vault, 'dev', ENV_CONTENT, PASSPHRASE);
    vault = await addEntry(vault, 'staging', ENV_CONTENT, PASSPHRASE);
    vault = await addEntry(vault, 'production', ENV_CONTENT, PASSPHRASE);
    expect(listEnvironments(vault).sort()).toEqual(['dev', 'production', 'staging']);
  });

  it('fails to decrypt with wrong passphrase', async () => {
    let vault = createVault();
    vault = await addEntry(vault, 'production', ENV_CONTENT, PASSPHRASE);
    await expect(getEntry(vault, 'production', 'wrong-passphrase')).rejects.toThrow();
  });
});
