import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { registerLockCommand, isVaultLocked } from './lock';
import { createVault, writeVaultFile } from '../../vault';

const VAULT_PATH = '/tmp/test-lock.envault';
const LOCK_PATH = '/tmp/.envault.lock';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerLockCommand(program, VAULT_PATH);
  return program;
}

beforeEach(() => {
  const vault = createVault();
  writeVaultFile(VAULT_PATH, vault);
  if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
});

afterEach(() => {
  if (fs.existsSync(VAULT_PATH)) fs.unlinkSync(VAULT_PATH);
  if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
});

describe('lock command', () => {
  it('creates a lock file when vault exists', async () => {
    const program = buildProgram();
    await program.parseAsync(['lock'], { from: 'user' });
    expect(fs.existsSync(LOCK_PATH)).toBe(true);
  });

  it('reports already locked if lock file exists', async () => {
    fs.writeFileSync(LOCK_PATH, new Date().toISOString());
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['lock'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('Vault is already locked.');
    consoleSpy.mockRestore();
  });

  it('exits with error when no vault found', async () => {
    if (fs.existsSync(VAULT_PATH)) fs.unlinkSync(VAULT_PATH);
    const program = buildProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['lock'], { from: 'user' })).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('No vault found. Run `envault init` first.');
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('isVaultLocked', () => {
  it('returns false when lock file does not exist', () => {
    expect(isVaultLocked(VAULT_PATH)).toBe(false);
  });

  it('returns true when lock file exists', () => {
    fs.writeFileSync(LOCK_PATH, new Date().toISOString());
    expect(isVaultLocked(VAULT_PATH)).toBe(true);
  });
});
