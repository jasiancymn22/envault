import {
  extractTemplate,
  generateFromTemplate,
  validateAgainstTemplate,
  serializeTemplate,
  deserializeTemplate,
} from './template';

describe('extractTemplate', () => {
  it('extracts keys from env data', () => {
    const envData = 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret';
    const template = extractTemplate(envData, 'my-template', 'A test template');
    expect(template.name).toBe('my-template');
    expect(template.description).toBe('A test template');
    expect(template.keys.map((k) => k.key)).toEqual(['DB_HOST', 'DB_PORT', 'API_KEY']);
    expect(template.keys.every((k) => k.required)).toBe(true);
    expect(template.createdAt).toBeDefined();
  });

  it('handles empty env data', () => {
    const template = extractTemplate('', 'empty');
    expect(template.keys).toHaveLength(0);
  });
});

describe('generateFromTemplate', () => {
  it('generates blank env string from template', () => {
    const template = extractTemplate('FOO=bar\nBAZ=qux', 'test');
    const result = generateFromTemplate(template);
    expect(result).toContain('FOO=');
    expect(result).toContain('BAZ=');
  });

  it('uses default values when provided', () => {
    const template = extractTemplate('PORT=3000', 'test');
    template.keys[0].defaultValue = '8080';
    const result = generateFromTemplate(template);
    expect(result).toContain('PORT=8080');
  });
});

describe('validateAgainstTemplate', () => {
  it('returns empty array when all required keys are present', () => {
    const template = extractTemplate('FOO=1\nBAR=2', 'test');
    const missing = validateAgainstTemplate('FOO=hello\nBAR=world', template);
    expect(missing).toHaveLength(0);
  });

  it('returns missing required keys', () => {
    const template = extractTemplate('FOO=1\nBAR=2\nBAZ=3', 'test');
    const missing = validateAgainstTemplate('FOO=hello', template);
    expect(missing).toContain('BAR');
    expect(missing).toContain('BAZ');
  });

  it('ignores optional keys', () => {
    const template = extractTemplate('FOO=1\nBAR=2', 'test');
    template.keys[1].required = false;
    const missing = validateAgainstTemplate('FOO=hello', template);
    expect(missing).toHaveLength(0);
  });
});

describe('serializeTemplate / deserializeTemplate', () => {
  it('round-trips a template through JSON', () => {
    const template = extractTemplate('X=1\nY=2', 'roundtrip', 'desc');
    const json = serializeTemplate(template);
    const restored = deserializeTemplate(json);
    expect(restored.name).toBe('roundtrip');
    expect(restored.keys).toHaveLength(2);
  });

  it('throws on invalid JSON structure', () => {
    expect(() => deserializeTemplate('{"foo":"bar"}')).toThrow(
      'Invalid template format'
    );
  });
});
