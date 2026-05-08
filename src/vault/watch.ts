import * as fs from 'fs';
import * as path from 'path';

export interface WatchEvent {
  type: 'change' | 'rename';
  vaultPath: string;
  timestamp: Date;
}

export type WatchCallback = (event: WatchEvent) => void;

export interface WatchHandle {
  stop: () => void;
  isActive: () => boolean;
}

let _watcher: fs.FSWatcher | null = null;

export function watchVault(
  vaultPath: string,
  callback: WatchCallback,
  debounceMs = 300
): WatchHandle {
  const resolvedPath = path.resolve(vaultPath);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  _watcher = fs.watch(resolvedPath, (eventType) => {
    if (!active) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      callback({
        type: eventType === 'rename' ? 'rename' : 'change',
        vaultPath: resolvedPath,
        timestamp: new Date(),
      });
    }, debounceMs);
  });

  _watcher.on('error', (err) => {
    if (active) {
      console.error(`[envault] watch error: ${err.message}`);
    }
  });

  return {
    stop: () => {
      active = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (_watcher) {
        _watcher.close();
        _watcher = null;
      }
    },
    isActive: () => active,
  };
}

export function formatWatchEvent(event: WatchEvent): string {
  const time = event.timestamp.toISOString();
  return `[${time}] vault ${event.type}d: ${event.vaultPath}`;
}
