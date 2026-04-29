import { Command } from 'commander';
import { registerValidateCommand, validateEnvData } from './validate';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerValidateCommand(program);
  return program;
}

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('./validate', () => ({
  ...jest.requireActual('./validate'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

describe('validateEnvData', () => {
  it('returns valid result for well-formed data', () => {
    const result = validateEnvData('production', { API_KEY: 'abc123', DB_URL: 'postgres://...' });
    expect(result.valid).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.emptyValues).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('detects empty values', () => {
    const result = validateEnvData('staging', { API_KEY: '', DB_URL: 'value' });
    expect(result.emptyValues).toContain('API_KEY');
    expect(result.valid).toBe(true);
  });

  it('detects invalid key names', () => {
    const result = validateEnvData('dev', { '123INVALID': 'value' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid key name/);
  });
});

describe('validate command', () => {
  const mockVault = {
    environments: {
      production: 'encrypted-payload',
      staging: 'encrypted-payload-2',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vault.readVaultFile as jest.Mock).mockReturnValue(mockVault);
    (crypto.decrypt as jest.Mock).mockResolvedValue('API_KEY=abc123\nDB_URL=postgres://localhost');
  });

  it('validates all environments when no env specified', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'validate', '--vault-file', '.envault']);
    expect(crypto.decrypt).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });

  it('validates a single environment', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'validate', 'production', '--vault-file', '.envault']);
    expect(crypto.decrypt).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it('handles missing environment gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'validate', 'unknown', '--vault-file', '.envault']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    consoleSpy.mockRestore();
  });
});
