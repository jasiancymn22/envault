import { Command } from 'commander';
import { registerWatchCommand } from './watch';
import * as watchModule from '../../vault/watch';
import * as vaultModule from '../../vault';
import * as cryptoModule from '../../crypto';

jest.mock('../../vault/watch');
jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('@inquirer/prompts', () => ({
  password: jest.fn().mockResolvedValue('masterpassword'),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchCommand(program);
  return program;
}

describe('watch command', () => {
  const mockHandle = {
    stop: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (watchModule.watchVault as jest.Mock).mockReturnValue(mockHandle);
    (watchModule.formatWatchEvent as jest.Mock).mockReturnValue('[ts] vault changed: /fake.vault');
    (vaultModule.readVaultFile as jest.Mock).mockResolvedValue({
      environments: {
        default: { data: 'encrypted-blob' },
      },
    });
    (cryptoModule.decrypt as jest.Mock).mockResolvedValue('KEY1=val1\nKEY2=val2');
  });

  it('registers the watch command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe('Watch a vault file for changes and display updated keys');
  });

  it('calls watchVault with correct arguments', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'watch', '/fake.vault', '--no-decrypt']);
    expect(watchModule.watchVault).toHaveBeenCalledWith(
      '/fake.vault',
      expect.any(Function),
      300
    );
  });

  it('uses custom debounce value', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'watch', '/fake.vault', '--debounce', '500', '--no-decrypt',
    ]);
    expect(watchModule.watchVault).toHaveBeenCalledWith(
      '/fake.vault',
      expect.any(Function),
      500
    );
  });

  it('invokes callback and decrypts vault on change event', async () => {
    const program = buildProgram();
    let capturedCallback: Function | null = null;
    (watchModule.watchVault as jest.Mock).mockImplementation((_p: string, cb: Function) => {
      capturedCallback = cb;
      return mockHandle;
    });

    await program.parseAsync(['node', 'envault', 'watch', '/fake.vault']);

    expect(capturedCallback).not.toBeNull();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await capturedCallback!({ type: 'change', vaultPath: '/fake.vault', timestamp: new Date() });

    expect(vaultModule.readVaultFile).toHaveBeenCalledWith('/fake.vault');
    expect(cryptoModule.decrypt).toHaveBeenCalledWith('encrypted-blob', 'masterpassword');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('KEY1, KEY2'));

    consoleSpy.mockRestore();
  });
});
