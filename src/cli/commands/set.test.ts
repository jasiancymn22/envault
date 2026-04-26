import { jest } from '@jest/globals';
import { encrypt, decrypt } from '../../crypto';
import { parseEnv, mergeEnv } from '../../vault/envParser';
import { createVault } from '../../vault';

describe('set command logic', () => {
  const password = 'test-password-123';

  it('encrypts and stores new env variables', async () => {
    const vault = createVault();
    const newVars = parseEnv('API_KEY=abc123\nDB_URL=postgres://localhost/db');
    const plaintext = Object.entries(newVars).map(([k, v]) => `${k}=${v}`).join('\n');
    const encrypted = await encrypt(plaintext, password);

    vault.environments['production'] = { encrypted, updatedAt: new Date().toISOString() };

    expect(vault.environments['production']).toBeDefined();
    expect(vault.environments['production'].encrypted).toBeTruthy();
  });

  it('merges new variables with existing ones', async () => {
    const existing = { API_KEY: 'old_key', DEBUG: 'false' };
    const incoming = { API_KEY: 'new_key', NEW_VAR: 'hello' };
    const merged = mergeEnv(existing, incoming);

    expect(merged['API_KEY']).toBe('new_key');
    expect(merged['DEBUG']).toBe('false');
    expect(merged['NEW_VAR']).toBe('hello');
  });

  it('round-trips encrypted data correctly', async () => {
    const original = 'API_KEY=secret\nDB_PASS=hunter2';
    const encrypted = await encrypt(original, password);
    const decrypted = await decrypt(encrypted, password);
    expect(decrypted).toBe(original);
  });

  it('fails to decrypt with wrong password', async () => {
    const original = 'SECRET=value';
    const encrypted = await encrypt(original, password);
    await expect(decrypt(encrypted, 'wrong-password')).rejects.toThrow();
  });

  it('creates a new vault when none exists', () => {
    const vault = createVault();
    expect(vault.environments).toEqual({});
    expect(vault.version).toBeDefined();
  });
});
