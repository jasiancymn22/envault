import { parseEnv, stringifyEnv } from './envParser';

export interface VaultTemplate {
  name: string;
  description?: string;
  keys: TemplateKey[];
  createdAt: string;
}

export interface TemplateKey {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

/**
 * Extract a template from existing env data (keys only, no values)
 */
export function extractTemplate(
  envData: string,
  name: string,
  description?: string
): VaultTemplate {
  const parsed = parseEnv(envData);
  const keys: TemplateKey[] = Object.keys(parsed).map((key) => ({
    key,
    required: true,
  }));

  return {
    name,
    description,
    keys,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a blank .env string from a template (keys with empty or default values)
 */
export function generateFromTemplate(template: VaultTemplate): string {
  const entries: Record<string, string> = {};
  for (const tk of template.keys) {
    entries[tk.key] = tk.defaultValue ?? '';
  }
  return stringifyEnv(entries);
}

/**
 * Validate env data against a template — returns missing required keys
 */
export function validateAgainstTemplate(
  envData: string,
  template: VaultTemplate
): string[] {
  const parsed = parseEnv(envData);
  const missing: string[] = [];
  for (const tk of template.keys) {
    if (tk.required && !(tk.key in parsed)) {
      missing.push(tk.key);
    }
  }
  return missing;
}

/**
 * Serialize a template to JSON string
 */
export function serializeTemplate(template: VaultTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Deserialize a template from JSON string
 */
export function deserializeTemplate(raw: string): VaultTemplate {
  const parsed = JSON.parse(raw);
  if (!parsed.name || !Array.isArray(parsed.keys)) {
    throw new Error('Invalid template format: missing name or keys');
  }
  return parsed as VaultTemplate;
}
