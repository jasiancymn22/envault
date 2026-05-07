import { VaultData } from './vault';

export interface SchemaField {
  key: string;
  required: boolean;
  pattern?: string;
  description?: string;
}

export interface EnvSchema {
  version: string;
  fields: SchemaField[];
}

export interface SchemaValidationResult {
  valid: boolean;
  missing: string[];
  invalid: { key: string; reason: string }[];
}

export function parseSchema(raw: string): EnvSchema {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.version || !Array.isArray(parsed.fields)) {
      throw new Error('Invalid schema format: missing version or fields array');
    }
    return parsed as EnvSchema;
  } catch (err) {
    throw new Error(`Failed to parse schema: ${(err as Error).message}`);
  }
}

export function serializeSchema(schema: EnvSchema): string {
  return JSON.stringify(schema, null, 2);
}

export function validateAgainstSchema(
  data: Record<string, string>,
  schema: EnvSchema
): SchemaValidationResult {
  const missing: string[] = [];
  const invalid: { key: string; reason: string }[] = [];

  for (const field of schema.fields) {
    const value = data[field.key];

    if (field.required && (value === undefined || value === '')) {
      missing.push(field.key);
      continue;
    }

    if (value !== undefined && field.pattern) {
      try {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          invalid.push({
            key: field.key,
            reason: `Value does not match pattern: ${field.pattern}`,
          });
        }
      } catch {
        invalid.push({
          key: field.key,
          reason: `Invalid pattern in schema: ${field.pattern}`,
        });
      }
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

export function extractSchemaFromVault(
  vault: VaultData,
  environment: string
): SchemaField[] {
  const envData = vault.environments[environment];
  if (!envData) return [];

  return Object.keys(envData).map((key) => ({
    key,
    required: true,
    description: '',
  }));
}
