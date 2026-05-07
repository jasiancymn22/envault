import {
  parseSchema,
  serializeSchema,
  validateAgainstSchema,
  extractSchemaFromVault,
  EnvSchema,
} from './schema';

const sampleSchema: EnvSchema = {
  version: '1.0',
  fields: [
    { key: 'DATABASE_URL', required: true, pattern: '^postgres://' },
    { key: 'PORT', required: true, pattern: '^\\d+$' },
    { key: 'DEBUG', required: false },
  ],
};

describe('parseSchema', () => {
  it('parses valid schema JSON', () => {
    const raw = JSON.stringify(sampleSchema);
    const result = parseSchema(raw);
    expect(result.version).toBe('1.0');
    expect(result.fields).toHaveLength(3);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseSchema('not-json')).toThrow('Failed to parse schema');
  });

  it('throws when fields array is missing', () => {
    expect(() => parseSchema(JSON.stringify({ version: '1.0' }))).toThrow(
      'Invalid schema format'
    );
  });
});

describe('serializeSchema', () => {
  it('serializes schema to formatted JSON', () => {
    const raw = serializeSchema(sampleSchema);
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0');
    expect(parsed.fields).toHaveLength(3);
  });
});

describe('validateAgainstSchema', () => {
  it('returns valid for matching data', () => {
    const data = { DATABASE_URL: 'postgres://localhost/db', PORT: '5432' };
    const result = validateAgainstSchema(data, sampleSchema);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });

  it('detects missing required fields', () => {
    const result = validateAgainstSchema({}, sampleSchema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('DATABASE_URL');
    expect(result.missing).toContain('PORT');
  });

  it('detects pattern mismatch', () => {
    const data = { DATABASE_URL: 'mysql://localhost/db', PORT: '5432' };
    const result = validateAgainstSchema(data, sampleSchema);
    expect(result.valid).toBe(false);
    expect(result.invalid[0].key).toBe('DATABASE_URL');
  });

  it('allows optional fields to be absent', () => {
    const data = { DATABASE_URL: 'postgres://localhost/db', PORT: '3000' };
    const result = validateAgainstSchema(data, sampleSchema);
    expect(result.valid).toBe(true);
  });
});

describe('extractSchemaFromVault', () => {
  it('extracts fields from vault environment', () => {
    const vault = {
      version: '1',
      environments: { production: { API_KEY: 'abc', SECRET: 'xyz' } },
    } as any;
    const fields = extractSchemaFromVault(vault, 'production');
    expect(fields.map((f) => f.key)).toEqual(['API_KEY', 'SECRET']);
    expect(fields.every((f) => f.required)).toBe(true);
  });

  it('returns empty array for unknown environment', () => {
    const vault = { version: '1', environments: {} } as any;
    expect(extractSchemaFromVault(vault, 'staging')).toEqual([]);
  });
});
