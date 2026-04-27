import fs from 'fs';

export interface VaultEntry {
  iv: string;
  salt: string;
  ciphertext: string;
  tag: string;
}

export interface VaultEnvironment {
  [key: string]: VaultEntry;
}

export interface Vault {
  version: number;
  createdAt: string;
  updatedAt: string;
  environments: Record<string, VaultEnvironment>;
}

export function createVault(environments: string[]): Vault {
  const now = new Date().toISOString();
  const envMap: Record<string, VaultEnvironment> = {};
  for (const env of environments) {
    envMap[env] = {};
  }
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    environments: envMap,
  };
}

export function readVaultFile(filePath: string): Vault {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Vault file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Vault;
}

export function writeVaultFile(filePath: string, vault: Vault): void {
  vault.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(vault, null, 2), 'utf-8');
}

export function removeEntry(
  vault: Vault,
  environment: string,
  key: string
): Vault {
  if (!vault.environments[environment]) {
    throw new Error(`Environment '${environment}' does not exist in vault.`);
  }
  if (!vault.environments[environment][key]) {
    throw new Error(
      `Key '${key}' does not exist in environment '${environment}'.`
    );
  }
  delete vault.environments[environment][key];
  return vault;
}

export function listEnvironments(vault: Vault): string[] {
  return Object.keys(vault.environments);
}

export function addEnvironment(vault: Vault, environment: string): Vault {
  if (vault.environments[environment]) {
    throw new Error(`Environment '${environment}' already exists in vault.`);
  }
  vault.environments[environment] = {};
  return vault;
}

export function removeEnvironment(vault: Vault, environment: string): Vault {
  if (!vault.environments[environment]) {
    throw new Error(`Environment '${environment}' does not exist in vault.`);
  }
  delete vault.environments[environment];
  return vault;
}
