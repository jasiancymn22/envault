import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { readVaultFile } from '../../vault';

export interface AuditResult {
  environment: string;
  keyCount: number;
  lastModified: Date | null;
  hasEntries: boolean;
}

export function auditVault(vaultPath: string): AuditResult[] {
  const vault = readVaultFile(vaultPath);
  const results: AuditResult[] = [];

  let fileStat: fs.Stats | null = null;
  try {
    fileStat = fs.statSync(vaultPath);
  } catch {
    fileStat = null;
  }

  for (const [envName, envData] of Object.entries(vault.environments)) {
    const keyCount = envData.keys ? Object.keys(envData.keys).length : 0;
    results.push({
      environment: envName,
      keyCount,
      lastModified: fileStat ? fileStat.mtime : null,
      hasEntries: keyCount > 0,
    });
  }

  return results;
}

export function formatAuditResults(results: AuditResult[], vaultPath: string): string {
  if (results.length === 0) {
    return 'No environments found in vault.';
  }

  const lines: string[] = [
    `Vault: ${path.resolve(vaultPath)}`,
    `Environments: ${results.length}`,
    '',
    'Environment         Keys   Has Entries',
    '─'.repeat(42),
  ];

  for (const r of results) {
    const envPad = r.environment.padEnd(20);
    const keysPad = String(r.keyCount).padEnd(7);
    const hasEntries = r.hasEntries ? '✔' : '✘';
    lines.push(`${envPad}${keysPad}${hasEntries}`);
  }

  const totalKeys = results.reduce((sum, r) => sum + r.keyCount, 0);
  lines.push('─'.repeat(42));
  lines.push(`Total keys across all environments: ${totalKeys}`);

  return lines.join('\n');
}

export function registerAuditCommand(program: Command, vaultPath: string): void {
  program
    .command('audit')
    .description('Display a summary audit of all environments in the vault')
    .option('--json', 'Output results as JSON')
    .action((options) => {
      try {
        const results = auditVault(vaultPath);
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          console.log(formatAuditResults(results, vaultPath));
        }
      } catch (err: any) {
        console.error(`Error auditing vault: ${err.message}`);
        process.exit(1);
      }
    });
}
