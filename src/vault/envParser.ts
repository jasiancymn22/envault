export type EnvMap = Record<string, string>;

/**
 * Parses a .env file string into a key-value map.
 * Supports comments (#), quoted values, and ignores blank lines.
 */
export function parseEnv(content: string): EnvMap {
  const result: EnvMap = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
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

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serializes a key-value map back into a .env file string.
 */
export function stringifyEnv(envMap: EnvMap): string {
  return Object.entries(envMap)
    .map(([key, value]) => {
      const needsQuotes = /\s|#|=/.test(value);
      const serializedValue = needsQuotes ? `"${value}"` : value;
      return `${key}=${serializedValue}`;
    })
    .join('\n');
}

/**
 * Merges two env maps, with overrides taking precedence.
 */
export function mergeEnv(base: EnvMap, overrides: EnvMap): EnvMap {
  return { ...base, ...overrides };
}
