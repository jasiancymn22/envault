import { computeStats, VaultStats } from './stats';
import * as vault from '../../vault';
import * as crypto from '../../crypto';
import { Command } from 'commander';
import { registerStatsCommand } from './stats';

jest.mock('../../vault');
jest.mock('../../crypto');

const mockReadVaultFile = vault.readVaultFile as jest.MockedFunction<typeof vault.readVaultFile>;
const mockDecrypt = crypto.decrypt as jest.MockedFunction<typeof crypto.decrypt>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerStatsCommand(program);
  return program;
}

describe('computeStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct stats for multiple environments', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: {
        development: { data: 'enc-dev' },
        production: { data: 'enc-prod' },
      },
    } as any);

    mockDecrypt
      .mockResolvedValueOnce('DB_HOST=localhost\nDB_PORT=5432\nDEV_ONLY=true')
      .mockResolvedValueOnce('DB_HOST=prod.db\nDB_PORT=5432\nPROD_ONLY=true');

    const stats: VaultStats = await computeStats('.envault', 'secret');

    expect(stats.totalEnvironments).toBe(2);
    expect(stats.totalKeys).toBe(4);
    expect(stats.keysPerEnvironment).toEqual({ development: 3, production: 3 });
    expect(stats.sharedKeys).toEqual(['DB_HOST', 'DB_PORT']);
    expect(stats.uniqueKeys).toEqual(['DEV_ONLY', 'PROD_ONLY']);
  });

  it('handles a single environment with no shared keys', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: {
        staging: { data: 'enc-staging' },
      },
    } as any);

    mockDecrypt.mockResolvedValueOnce('API_KEY=abc\nDEBUG=true');

    const stats = await computeStats('.envault', 'secret');

    expect(stats.totalEnvironments).toBe(1);
    expect(stats.totalKeys).toBe(2);
    expect(stats.sharedKeys).toEqual([]);
    expect(stats.keysPerEnvironment).toEqual({ staging: 2 });
  });

  it('throws when decrypt fails', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { production: { data: 'bad' } },
    } as any);
    mockDecrypt.mockRejectedValueOnce(new Error('Invalid password'));

    await expect(computeStats('.envault', 'wrong')).rejects.toThrow('Invalid password');
  });
});

describe('registerStatsCommand', () => {
  it('registers the stats command on a program', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'stats');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe('Show statistics about the vault and its environments');
  });
});
