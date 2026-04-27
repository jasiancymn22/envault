import { Command } from 'commander';
import { formatEnvironmentKeys, registerListCommand } from './list';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({ close: jest.fn() }),
}));

const mockVault = vault as jest.Mocked<typeof vault>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerListCommand(program);
  return program;
}

describe('formatEnvironmentKeys', () => {
  it('should format keys with bullet points', () => {
    const result = formatEnvironmentKeys(['API_KEY', 'DB_URL']);
    expect(result).toContain('API_KEY');
    expect(result).toContain('DB_URL');
  });

  it('should return empty message when no keys', () => {
    const result = formatEnvironmentKeys([]);
    expect(result).toMatch(/no keys/i);
  });
});

describe('list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVault.readVaultFile.mockReturnValue({
      version: 1,
      environments: {
        development: { encrypted: 'enc-data' },
      },
    });
    mockCrypto.decrypt.mockResolvedValue(JSON.stringify({ API_KEY: 'abc', DB_URL: 'postgres' }));
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process.stdin, 'on').mockImplementation((event: any, cb: any) => {
      if (event === 'data') setTimeout(() => cb('\n'), 0);
      return process.stdin;
    });
  });

  it('should list environments when no env flag is given', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'list']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('development'));
  });

  it('should exit if vault has no environments', async () => {
    mockVault.readVaultFile.mockReturnValue({ version: 1, environments: {} });
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'envault', 'list']))
      .rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
