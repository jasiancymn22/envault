import { Command } from 'commander';
import { registerTagCommand } from './tag';
import * as vault from '../../vault';

jest.mock('../../vault');

const mockReadVaultFile = vault.readVaultFile as jest.MockedFunction<typeof vault.readVaultFile>;
const mockWriteVaultFile = vault.writeVaultFile as jest.MockedFunction<typeof vault.writeVaultFile>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTagCommand(program);
  return program;
}

describe('tag command', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWriteVaultFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists tags for an environment', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { production: { tags: ['stable', 'live'] } },
    } as any);
    const program = buildProgram();
    await program.parseAsync(['tag', 'production', '--list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('Tags for "production": stable, live');
  });

  it('shows message when no tags exist', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { staging: { tags: [] } },
    } as any);
    const program = buildProgram();
    await program.parseAsync(['tag', 'staging', '--list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No tags for environment "staging".');
  });

  it('adds tags to an environment', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { development: { tags: [] } },
    } as any);
    const program = buildProgram();
    await program.parseAsync(['tag', 'development', 'wip', 'local'], { from: 'user' });
    expect(mockWriteVaultFile).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Added tag(s) [wip, local] to "development".');
  });

  it('removes a tag from an environment', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { production: { tags: ['stable', 'live'] } },
    } as any);
    const program = buildProgram();
    await program.parseAsync(['tag', 'production', '--remove', 'live'], { from: 'user' });
    expect(mockWriteVaultFile).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Removed tag "live" from "production".');
  });

  it('errors when environment does not exist', async () => {
    mockReadVaultFile.mockResolvedValue({ environments: {} } as any);
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['tag', 'ghost', '--list'], { from: 'user' })).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith('Environment "ghost" does not exist.');
    exitSpy.mockRestore();
  });
});
