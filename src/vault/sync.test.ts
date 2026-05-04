import * as fs from 'fs';
import { computeSyncDiff, writeEnvFile, readEnvFile } from './sync';

jest.mock('fs');

describe('computeSyncDiff', () => {
  it('detects added keys', () => {
    const result = computeSyncDiff('', 'NEW_KEY=value');
    expect(result.added).toContain('NEW_KEY');
    expect(result.updated).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('detects updated keys', () => {
    const result = computeSyncDiff('KEY=old', 'KEY=new');
    expect(result.updated).toContain('KEY');
    expect(result.added).toHaveLength(0);
  });

  it('detects removed keys', () => {
    const result = computeSyncDiff('OLD=value', '');
    expect(result.removed).toContain('OLD');
  });

  it('detects unchanged keys', () => {
    const result = computeSyncDiff('KEY=same', 'KEY=same');
    expect(result.unchanged).toContain('KEY');
    expect(result.updated).toHaveLength(0);
  });

  it('handles mixed changes', () => {
    const existing = 'A=1\nB=2\nC=3';
    const incoming = 'A=1\nB=changed\nD=4';
    const result = computeSyncDiff(existing, incoming);
    expect(result.unchanged).toContain('A');
    expect(result.updated).toContain('B');
    expect(result.removed).toContain('C');
    expect(result.added).toContain('D');
  });
});

describe('writeEnvFile', () => {
  it('writes content to file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    writeEnvFile('/some/path/.env', 'KEY=value');
    expect(fs.writeFileSync).toHaveBeenCalledWith('/some/path/.env', 'KEY=value', 'utf-8');
  });

  it('creates directories if missing', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    writeEnvFile('/new/dir/.env', 'KEY=value');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/new/dir', { recursive: true });
  });
});

describe('readEnvFile', () => {
  it('returns file content if exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('KEY=value');
    expect(readEnvFile('/path/.env')).toBe('KEY=value');
  });

  it('returns empty string if file missing', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(readEnvFile('/missing/.env')).toBe('');
  });
});
