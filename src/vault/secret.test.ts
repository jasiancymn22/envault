import {
  encryptSecret,
  decryptSecret,
  updateSecretMetadata,
  filterSecretsByTag,
  groupSecretsByEnvironment,
  SecretEntry,
} from './secret';

const PASSWORD = 'test-password-123';

describe('encryptSecret / decryptSecret', () => {
  it('encrypts and decrypts a secret value', async () => {
    const entry = await encryptSecret('DB_URL', 'postgres://localhost/db', 'production', PASSWORD);
    expect(entry.metadata.key).toBe('DB_URL');
    expect(entry.metadata.environment).toBe('production');
    expect(entry.encryptedValue).toBeTruthy();
    const value = await decryptSecret(entry, PASSWORD);
    expect(value).toBe('postgres://localhost/db');
  });

  it('stores optional tags and description', async () => {
    const entry = await encryptSecret('API_KEY', 'secret', 'staging', PASSWORD, {
      tags: ['api', 'external'],
      description: 'Third-party API key',
    });
    expect(entry.metadata.tags).toEqual(['api', 'external']);
    expect(entry.metadata.description).toBe('Third-party API key');
  });

  it('fails to decrypt with wrong password', async () => {
    const entry = await encryptSecret('TOKEN', 'abc123', 'development', PASSWORD);
    await expect(decryptSecret(entry, 'wrong-password')).rejects.toThrow();
  });
});

describe('updateSecretMetadata', () => {
  it('updates tags and description without changing key fields', async () => {
    const entry = await encryptSecret('FOO', 'bar', 'production', PASSWORD);
    const updated = updateSecretMetadata(entry, { tags: ['new-tag'], description: 'Updated' });
    expect(updated.metadata.tags).toEqual(['new-tag']);
    expect(updated.metadata.description).toBe('Updated');
    expect(updated.metadata.key).toBe('FOO');
    expect(updated.metadata.updatedAt).not.toBe(entry.metadata.updatedAt);
  });
});

describe('filterSecretsByTag', () => {
  it('returns only entries matching the tag', async () => {
    const a = await encryptSecret('A', '1', 'prod', PASSWORD, { tags: ['db'] });
    const b = await encryptSecret('B', '2', 'prod', PASSWORD, { tags: ['api'] });
    const c = await encryptSecret('C', '3', 'prod', PASSWORD, { tags: ['db', 'api'] });
    const result = filterSecretsByTag([a, b, c], 'db');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.metadata.key)).toEqual(['A', 'C']);
  });
});

describe('groupSecretsByEnvironment', () => {
  it('groups entries by environment', async () => {
    const a = await encryptSecret('A', '1', 'production', PASSWORD);
    const b = await encryptSecret('B', '2', 'staging', PASSWORD);
    const c = await encryptSecret('C', '3', 'production', PASSWORD);
    const groups = groupSecretsByEnvironment([a, b, c]);
    expect(Object.keys(groups)).toEqual(['production', 'staging']);
    expect(groups['production']).toHaveLength(2);
    expect(groups['staging']).toHaveLength(1);
  });
});
