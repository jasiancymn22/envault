import { parseEnv } from './envParser';

export type DiffEntryType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  type: DiffEntryType;
  oldValue?: string;
  newValue?: string;
}

export interface EnvDiff {
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: DiffEntry[];
  unchanged: DiffEntry[];
}

export function computeEnvDiff(sourceEnv: string, targetEnv: string): EnvDiff {
  const sourceMap = parseEnv(sourceEnv);
  const targetMap = parseEnv(targetEnv);

  const allKeys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);

  const result: EnvDiff = { added: [], removed: [], changed: [], unchanged: [] };

  for (const key of allKeys) {
    const inSource = key in sourceMap;
    const inTarget = key in targetMap;

    if (inSource && !inTarget) {
      result.removed.push({ key, type: 'removed', oldValue: sourceMap[key] });
    } else if (!inSource && inTarget) {
      result.added.push({ key, type: 'added', newValue: targetMap[key] });
    } else if (sourceMap[key] !== targetMap[key]) {
      result.changed.push({
        key,
        type: 'changed',
        oldValue: sourceMap[key],
        newValue: targetMap[key],
      });
    } else {
      result.unchanged.push({ key, type: 'unchanged', oldValue: sourceMap[key], newValue: targetMap[key] });
    }
  }

  return result;
}

export function formatDiff(diff: EnvDiff, maskValues = true): string {
  const lines: string[] = [];

  const mask = (v?: string) => (maskValues ? '***' : v ?? '');

  for (const entry of diff.added) {
    lines.push(`+ ${entry.key}=${mask(entry.newValue)}`);
  }
  for (const entry of diff.removed) {
    lines.push(`- ${entry.key}=${mask(entry.oldValue)}`);
  }
  for (const entry of diff.changed) {
    lines.push(`~ ${entry.key}: ${mask(entry.oldValue)} → ${mask(entry.newValue)}`);
  }

  if (lines.length === 0) {
    return 'No differences found.';
  }

  return lines.join('\n');
}

export function diffSummary(diff: EnvDiff): string {
  const { added, removed, changed } = diff;
  const parts: string[] = [];
  if (added.length) parts.push(`${added.length} added`);
  if (removed.length) parts.push(`${removed.length} removed`);
  if (changed.length) parts.push(`${changed.length} changed`);
  return parts.length ? parts.join(', ') : 'identical';
}
