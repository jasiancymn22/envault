import { Command } from 'commander';
import { auditVault, formatAuditResults, AuditResult } from './audit';
import * as vault from '../../vault';

jest.mock('../../vault');
jest.mock('fs');

const mockReadVaultFile = vault.readVaultFile as jest.MockedFunction<typeof vault.readVaultFile>;

function buildProgram(vaultPath: string): Command {
  const { registerAuditCommand } = require('./audit');
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program, vaultPath);
  return program;
}

describe('auditVault', () => {
  it('returns audit results for each environment', () => {
    mockReadVaultFile.mockReturnValue({
      version: 1,
      environments: {
        production: { keys: { DB_URL: 'enc1', API_KEY: 'enc2' }, iv: 'iv1', salt: 's1' },
        staging: { keys: { DB_URL: 'enc3' }, iv: 'iv2', salt: 's2' },
      },
    } as any);

    const results = auditVault('.envault');
    expect(results).toHaveLength(2);
    expect(results.find(r => r.environment === 'production')?.keyCount).toBe(2);
    expect(results.find(r => r.environment === 'staging')?.keyCount).toBe(1);
  });

  it('returns empty array when no environments exist', () => {
    mockReadVaultFile.mockReturnValue({ version: 1, environments: {} } as any);
    const results = auditVault('.envault');
    expect(results).toHaveLength(0);
  });

  it('marks environments with no keys as hasEntries false', () => {
    mockReadVaultFile.mockReturnValue({
      version: 1,
      environments: {
        empty: { keys: {}, iv: 'iv1', salt: 's1' },
      },
    } as any);
    const results = auditVault('.envault');
    expect(results[0].hasEntries).toBe(false);
  });
});

describe('formatAuditResults', () => {
  it('returns message when no results', () => {
    const output = formatAuditResults([], '.envault');
    expect(output).toContain('No environments found');
  });

  it('includes environment names and key counts', () => {
    const results: AuditResult[] = [
      { environment: 'production', keyCount: 3, lastModified: null, hasEntries: true },
    ];
    const output = formatAuditResults(results, '.envault');
    expect(output).toContain('production');
    expect(output).toContain('3');
    expect(output).toContain('Total keys across all environments: 3');
  });

  it('shows checkmark for environments with entries', () => {
    const results: AuditResult[] = [
      { environment: 'dev', keyCount: 1, lastModified: null, hasEntries: true },
      { environment: 'empty', keyCount: 0, lastModified: null, hasEntries: false },
    ];
    const output = formatAuditResults(results, '.envault');
    expect(output).toContain('✔');
    expect(output).toContain('✘');
  });
});
