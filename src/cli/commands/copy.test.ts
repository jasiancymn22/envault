import { Command } from 'commander';
import { registerCopyCommand } from './copy';
import * as vault from '../../vault';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCopyCommand(program);
  return program;
}

jest.mock('../../vault');
jest.mock('../../crypto');
jest.mock('readline', () => ({
  createInterface: () => ({
    question: (_: string, cb: (a: string) => void) => cb('testpass'),
    close: jest.fn(),
  }),
}));

const mockReadVaultFile = vault.readVaultFile as jest.Mock;
const mockWriteVaultFile = vault.writeVaultFile as jest.Mock;
const mockDecrypt = crypto.decrypt as jest.Mock;
const mockEncrypt = crypto.encrypt as jest.Mock;

describe('copy command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteVaultFile.mockResolvedValue(undefined);
    mockEncrypt.mockResolvedValue('encrypted-dest');
  });

  it('copies keys from source to new destination environment', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { staging: 'encrypted-staging' },
    });
    mockDecrypt.mockResolvedValue('KEY1=value1\nKEY2=value2');

    const program = buildProgram();
    await program.parseAsync(['copy', 'staging', 'production'], { from: 'user' });

    expect(mockDecrypt).toHaveBeenCalledWith('encrypted-staging', 'testpass');
    expect(mockEncrypt).toHaveBeenCalledWith('KEY1=value1\nKEY2=value2', 'testpass');
    expect(mockWriteVaultFile).toHaveBeenCalled();
  });

  it('skips existing keys in destination without --overwrite', async () => {
    mockReadVaultFile.mockResolvedValue({
      environments: { staging: 'enc-staging', production: 'enc-prod' },
    });
    mockDecrypt
      .mockResolvedValueOnce('KEY1=value1\nKEY2=value2')
      .mockResolvedValueOnce('KEY1=existing');

    const program = buildProgram();
    await program.parseAsync(['copy', 'staging', 'production'], { from: 'user' });

    const encryptCall = mockEncrypt.mock.calls[0][0] as string;
    expect(encryptCall).toContain('KEY2=value2');
    expect(encryptCall).not.toContain('KEY1=value1');
  });

  it('exits with error if source environment does not exist', async () => {
    mockReadVaultFile.mockResolvedValue({ environments: {} });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['copy', 'nonexistent', 'production'], { from: 'user' })
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
