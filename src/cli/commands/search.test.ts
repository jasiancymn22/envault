import { Command } from 'commander';
import { registerSearchCommand } from './search';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program;
}

describe('search command', () => {
  const mockVault = {
    version: '1.0',
    environments: {
      production: {
        entries: {
          DATABASE_URL: 'enc_db',
          API_KEY: 'enc_api',
          SECRET_TOKEN: 'enc_secret',
        },
      },
      staging: {
        entries: {
          DATABASE_URL: 'enc_db_stg',
          DEBUG: 'enc_debug',
        },
      },
    },
  };

  beforeEach(() => {
    jest.spyOn(vault, 'readVaultFile').mockReturnValue(mockVault as any);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('finds keys matching pattern across all environments', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', 'DATABASE']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[production]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[staging]'));
  });

  it('limits search to a specific environment with --env', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', 'DATABASE', '--env', 'staging']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[staging]'));
    const calls = (console.log as jest.Mock).mock.calls.flat();
    expect(calls.some((c: string) => c.includes('[production]'))).toBe(false);
  });

  it('reports no matches when pattern does not match', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', 'NONEXISTENT_KEY_XYZ']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No matches found'));
  });

  it('warns when specified environment does not exist', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', 'API', '--env', 'unknown']);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('searches values when --values flag is provided', async () => {
    jest.spyOn(crypto, 'decrypt').mockResolvedValue('my-secret-value');
    const searchModule = require('./search');
    jest.spyOn(searchModule, 'promptPassword').mockResolvedValue('password123');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', 'secret', '--values']);
    expect(crypto.decrypt).toHaveBeenCalled();
  });
});
