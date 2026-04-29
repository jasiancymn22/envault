import * as fs from 'fs';
import { encrypt, decrypt, serializePayload, deserializePayload } from '../crypto';

export interface VaultEntry {
  iv: string;
  salt: string;
  tag: string;
  data: string;
}

export interface Vault {
  version: number;
  createdAt: string;
  updatedAt: string;
  environments: Record<string, VaultEntry>;
  tags?: Record<string, string[]>;
}

export function createVault(): Vault {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    environments: {},
    tags: {},
  };
}

export function readVaultFile(vaultPath: string): Vault {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const raw = fs.readFileSync(vaultPath, 'utf-8');
  return JSON.parse(raw) as Vault;
}

export function writeVaultFile(vaultPath: string, vault: Vault): void {
  vault.updatedAt = new Date().toISOString();
  fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf-8');
}

export async function setEntry(
  vault: Vault,
  environment: string,
  password: string,
  data: string
): Promise<void> {
  const payload = await encrypt(password, data);
  vault.environments[environment] = serializePayload(payload);
}

export async function getEntry(
  vault: Vault,
  environment: string,
  password: string
): Promise<string> {
  const entry = vault.environments[environment];
  if (!entry) {
    throw new Error(`Environment "${environment}" not found in vault.`);
  }
  const payload = deserializePayload(entry);
  return decrypt(password, payload);
}

export function removeEntry(vault: Vault, environment: string): void {
  if (!vault.environments[environment]) {
    throw new Error(`Environment "${environment}" not found in vault.`);
  }
  delete vault.environments[environment];
}

export function listEnvironments(vault: Vault): string[] {
  return Object.keys(vault.environments);
}

export function renameEnvironment(vault: Vault, from: string, to: string): void {
  if (!vault.environments[from]) {
    throw new Error(`Environment "${from}" not found in vault.`);
  }
  if (vault.environments[to]) {
    throw new Error(`Environment "${to}" already exists in vault.`);
  }
  vault.environments[to] = vault.environments[from];
  delete vault.environments[from];
}
