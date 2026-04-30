import { Command } from 'commander';
import { registerHistoryCommand, formatHistoryEntry } from './history';
import * as vault from '../../vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommand(program);
  return program;
}

describe('formatHistoryEntry', () => {
  it('formats an entry with a key', () => {
    const entry = {
      timestamp: '2024-01-15T10:00:00.000Z',
      action: 'set',
      environment: 'production',
      key: 'API_KEY',
    };
    const result = formatHistoryEntry(0, entry);
    expect(result).toContain('SET');
    expect(result).toContain('production');
    expect(result).toContain('[API_KEY]');
  });

  it('formats an entry without a key', () => {
    const entry = {
      timestamp: '2024-01-15T10:00:00.000Z',
      action: 'rotate',
      environment: 'staging',
    };
    const result = formatHistoryEntry(1, entry);
    expect(result).toContain('ROTATE');
    expect(result).toContain('staging');
    expect(result).not.toContain('[');
  });
});

describe('history command', () => {
  const mockVault = {
    history: [
      { timestamp: '2024-01-14T08:00:00.000Z', action: 'set', environment: 'dev', key: 'DB_URL' },
      { timestamp: '2024-01-15T09:00:00.000Z', action: 'remove', environment: 'staging', key: 'OLD_KEY' },
      { timestamp: '2024-01-16T10:00:00.000Z', action: 'rotate', environment: 'production' },
    ],
  };

  beforeEach(() => {
    jest.spyOn(vault, 'readVaultFile').mockResolvedValue(mockVault as any);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('displays all history entries', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--no-password']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Vault History'));
  });

  it('filters history by environment', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--no-password', '--env', 'dev']);
    expect(vault.readVaultFile).toHaveBeenCalled();
    const logCalls = (console.log as jest.Mock).mock.calls.flat().join(' ');
    expect(logCalls).toContain('dev');
  });

  it('shows message when no history found', async () => {
    jest.spyOn(vault, 'readVaultFile').mockResolvedValue({ history: [] } as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'history', '--no-password']);
    expect(console.log).toHaveBeenCalledWith('No history entries found.');
  });

  it('handles vault read error gracefully', async () => {
    jest.spyOn(vault, 'readVaultFile').mockRejectedValue(new Error('Decryption failed'));
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'history', '--no-password'])).rejects.toThrow();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error reading vault history'), 'Decryption failed');
    mockExit.mockRestore();
  });
});
