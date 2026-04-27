import fs from 'fs';
import path from 'path';
import os from 'os';
import { initVault } from './init';

describe('initVault', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-init-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a vault file with specified environments', async () => {
    const vaultPath = path.join(tmpDir, '.envault');
    await initVault(vaultPath, ['development', 'production'], false);

    expect(fs.existsSync(vaultPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(content).toHaveProperty('environments');
    expect(Object.keys(content.environments)).toContain('development');
    expect(Object.keys(content.environments)).toContain('production');
  });

  it('exits if vault file exists and force is false', async () => {
    const vaultPath = path.join(tmpDir, '.envault');
    fs.writeFileSync(vaultPath, '{}', 'utf-8');

    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number) => {
        throw new Error(`process.exit(${code})`);
      });

    await expect(
      initVault(vaultPath, ['development'], false)
    ).rejects.toThrow('process.exit(1)');

    exitSpy.mockRestore();
  });

  it('overwrites existing vault file when force is true', async () => {
    const vaultPath = path.join(tmpDir, '.envault');
    fs.writeFileSync(vaultPath, '{"old":true}', 'utf-8');

    await initVault(vaultPath, ['staging'], true);

    const content = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(content).not.toHaveProperty('old');
    expect(Object.keys(content.environments)).toContain('staging');
  });

  it('creates a vault with a single environment', async () => {
    const vaultPath = path.join(tmpDir, '.envault');
    await initVault(vaultPath, ['production'], false);

    const content = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(Object.keys(content.environments)).toHaveLength(1);
    expect(Object.keys(content.environments)).toContain('production');
  });
});
