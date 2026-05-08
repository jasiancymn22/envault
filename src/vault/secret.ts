import { encrypt, decrypt, serializePayload, deserializePayload } from '../crypto';
import { deriveKey } from '../crypto';

export interface SecretMetadata {
  key: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  description?: string;
}

export interface SecretEntry {
  metadata: SecretMetadata;
  encryptedValue: string;
}

export async function encryptSecret(
  key: string,
  value: string,
  environment: string,
  password: string,
  options?: { tags?: string[]; description?: string }
): Promise<SecretEntry> {
  const derivedKey = await deriveKey(password);
  const payload = await encrypt(value, derivedKey);
  const now = new Date().toISOString();
  return {
    metadata: {
      key,
      environment,
      createdAt: now,
      updatedAt: now,
      tags: options?.tags,
      description: options?.description,
    },
    encryptedValue: serializePayload(payload),
  };
}

export async function decryptSecret(
  entry: SecretEntry,
  password: string
): Promise<string> {
  const derivedKey = await deriveKey(password);
  const payload = deserializePayload(entry.encryptedValue);
  return decrypt(payload, derivedKey);
}

export function updateSecretMetadata(
  entry: SecretEntry,
  updates: Partial<Pick<SecretMetadata, 'tags' | 'description'>>
): SecretEntry {
  return {
    ...entry,
    metadata: {
      ...entry.metadata,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function filterSecretsByTag(entries: SecretEntry[], tag: string): SecretEntry[] {
  return entries.filter((e) => e.metadata.tags?.includes(tag));
}

export function groupSecretsByEnvironment(
  entries: SecretEntry[]
): Record<string, SecretEntry[]> {
  return entries.reduce<Record<string, SecretEntry[]>>((acc, entry) => {
    const env = entry.metadata.environment;
    if (!acc[env]) acc[env] = [];
    acc[env].push(entry);
    return acc;
  }, {});
}
