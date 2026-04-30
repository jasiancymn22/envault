import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { generateBackupFilename, registerBackupCommand } from './backup';
import { writeVaultFile } from '../../vault';

jest.mock('../../vault', () => ({
  readVaultFile: jest.fn(),
  writeVaultFile: jest.fn(),
}));

const { readVaultFile } = require('../../vault');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerBackupCommand(program);
  return program;
}

describe('generateBackupFilename', () => {
  it('includes the base vault name in the backup filename', () => {
    const result = generateBackupFilename('/some/path/.envault');
    expect(result).toMatch(/^\.envault\.backup-/);
    expect(result).toMatch(/\.json$/);
  });

  it('includes a timestamp in the filename', () => {
    const before = Date.now();
    const result = generateBackupFilename('vault.json');
    expect(result).toMatch(/vault\.backup-\d{4}-\d{2}-\d{2}/);
  });
});

describe('backup command', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'envault-backup-test-'));
    vaultPath = path.join(tmpDir, '.envault');
    fs.writeFileSync(vaultPath, JSON.stringify({ environments: {} }));
    readVaultFile.mockResolvedValue({ environments: {} });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it('creates a backup file in the output directory', async () => {
    const outputDir = path.join(tmpDir, 'backups');
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'backup',
      '--vault', vaultPath,
      '--output', outputDir,
      '--no-password',
    ]);
    const files = fs.readdirSync(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/\.envault\.backup-.*\.json$/);
  });

  it('verifies password before creating backup', async () => {
    readVaultFile.mockRejectedValueOnce(new Error('Invalid password'));
    const program = buildProgram();
    const mockPrompt = jest.spyOn(require('./backup'), 'promptPassword').mockResolvedValue('wrongpass');
    await expect(
      program.parseAsync(['node', 'envault', 'backup', '--vault', vaultPath])
    ).rejects.toThrow();
    mockPrompt.mockRestore();
  });

  it('exits if vault file does not exist', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'envault', 'backup', '--vault', '/nonexistent/.envault', '--no-password'])
    ).rejects.toThrow();
  });
});
