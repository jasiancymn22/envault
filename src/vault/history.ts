export interface HistoryEntry {
  timestamp: string;
  action: string;
  environment: string;
  key?: string;
  actor?: string;
}

export function createHistoryEntry(
  action: string,
  environment: string,
  key?: string,
  actor?: string
): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    environment,
    ...(key !== undefined && { key }),
    ...(actor !== undefined && { actor }),
  };
}

export function appendHistory(
  existing: HistoryEntry[],
  entry: HistoryEntry,
  maxEntries = 500
): HistoryEntry[] {
  const updated = [...existing, entry];
  if (updated.length > maxEntries) {
    return updated.slice(updated.length - maxEntries);
  }
  return updated;
}

export function filterHistory(
  history: HistoryEntry[],
  options: { environment?: string; action?: string; limit?: number }
): HistoryEntry[] {
  let result = [...history];

  if (options.environment) {
    result = result.filter((e) => e.environment === options.environment);
  }

  if (options.action) {
    result = result.filter((e) => e.action === options.action);
  }

  if (options.limit !== undefined && options.limit > 0) {
    result = result.slice(-options.limit);
  }

  return result;
}
