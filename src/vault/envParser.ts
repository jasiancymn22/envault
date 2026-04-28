/**
 * Parse a .env formatted string into a key-value record.
 */
export function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Serialize a key-value record into a .env formatted string.
 */
export function stringifyEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => {
      const needsQuotes = /\s|#|"/.test(value);
      return needsQuotes ? `${key}="${value}"` : `${key}=${value}`;
    })
    .join('\n');
}

/**
 * Merge source env into target env.
 * If overwrite is true, source values replace target values for matching keys.
 * Otherwise, only keys absent in target are added.
 */
export function mergeEnv(
  target: Record<string, string>,
  source: Record<string, string>,
  overwrite = false
): Record<string, string> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (overwrite || !(key in result)) {
      result[key] = value;
    }
  }
  return result;
}
