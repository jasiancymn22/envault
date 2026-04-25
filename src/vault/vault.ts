import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt, serializePayload, deserializePayload } from '../crypto';

export interface VaultEntry {
  environment: string;
  encryptedAt: string;
  data: string;
}

export interface VaultFile {
  version: number;
  entries: Record<string, VaultEntry>;
}

const VAULT_VERSION = 1;

export function createVault(): VaultFile {
  return { version: VAULT_VERSION, entries: {} };
}

export async function addEntry(
  vault: VaultFile,
  environment: string,
  envContent: string,
  passphrase: string
): Promise<VaultFile> {
  const payload = await encrypt(envContent, passphrase);
  const serialized = serializePayload(payload);
  return {
    ...vault,
    entries: {
      ...vault.entries,
      [environment]: {
        environment,
        encryptedAt: new Date().toISOString(),
        data: serialized,
      },
    },
  };
}

export async function getEntry(
  vault: VaultFile,
  environment: string,
  passphrase: string
): Promise<string> {
  const entry = vault.entries[environment];
  if (!entry) {
    throw new Error(`Environment "${environment}" not found in vault`);
  }
  const payload = deserializePayload(entry.data);
  return decrypt(payload, passphrase);
}

export function removeEntry(vault: VaultFile, environment: string): VaultFile {
  if (!vault.entries[environment]) {
    throw new Error(`Environment "${environment}" not found in vault`);
  }
  const { [environment]: _, ...remaining } = vault.entries;
  return { ...vault, entries: remaining };
}

export function listEnvironments(vault: VaultFile): string[] {
  return Object.keys(vault.entries);
}

export function readVaultFile(filePath: string): VaultFile {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return createVault();
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  return JSON.parse(raw) as VaultFile;
}

export function writeVaultFile(filePath: string, vault: VaultFile): void {
  const resolved = path.resolve(filePath);
  fs.writeFileSync(resolved, JSON.stringify(vault, null, 2), 'utf-8');
}
