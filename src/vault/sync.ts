import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, stringifyEnv } from './envParser';

export interface SyncResult {
  added: string[];
  updated: string[];
  removed: string[];
  unchanged: string[];
}

/**
 * Computes a diff between existing file content and new env content.
 */
export function computeSyncDiff(existingContent: string, newContent: string): SyncResult {
  const existing = parseEnv(existingContent);
  const incoming = parseEnv(newContent);

  const added: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  for (const key of Object.keys(incoming)) {
    if (!(key in existing)) {
      added.push(key);
    } else if (existing[key] !== incoming[key]) {
      updated.push(key);
    } else {
      unchanged.push(key);
    }
  }

  for (const key of Object.keys(existing)) {
    if (!(key in incoming)) {
      removed.push(key);
    }
  }

  return { added, updated, removed, unchanged };
}

/**
 * Writes env content to a file, creating directories as needed.
 */
export function writeEnvFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Reads env file content, returning empty string if not found.
 */
export function readEnvFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}
