import {
  extractTemplate,
  generateFromTemplate,
  validateAgainstTemplate,
  serializeTemplate,
  deserializeTemplate,
} from './template';

describe('extractTemplate', () => {
  it('should extract keys from env data with empty values', () => {
    const envData = { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret' };
    const template = extractTemplate(envData);
    expect(template.keys).toEqual(['DB_HOST', 'DB_PORT', 'API_KEY']);
    expect(template.required).toEqual(['DB_HOST', 'DB_PORT', 'API_KEY']);
  });

  it('should mark keys with defaults as optional', () => {
    const envData = { DB_HOST: 'localhost', DEBUG: 'false' };
    const defaults = { DEBUG: 'false' };
    const template = extractTemplate(envData, defaults);
    expect(template.required).toContain('DB_HOST');
    expect(template.optional).toContain('DEBUG');
    expect(template.defaults).toEqual({ DEBUG: 'false' });
  });

  it('should produce an empty template for empty env data', () => {
    const template = extractTemplate({});
    expect(template.keys).toEqual([]);
    expect(template.required).toEqual([]);
    expect(template.optional).toEqual([]);
    expect(template.defaults).toEqual({});
  });
});

describe('generateFromTemplate', () => {
  it('should generate env data from template with provided values', () => {
    const template = {
      keys: ['DB_HOST', 'DB_PORT'],
      required: ['DB_HOST', 'DB_PORT'],
      optional: [],
      defaults: {},
    };
    const values = { DB_HOST: 'prod.db.example.com', DB_PORT: '5432' };
    const result = generateFromTemplate(template, values);
    expect(result).toEqual(values);
  });

  it('should apply defaults for missing optional keys', () => {
    const template = {
      keys: ['DB_HOST', 'DEBUG'],
      required: ['DB_HOST'],
      optional: ['DEBUG'],
      defaults: { DEBUG: 'false' },
    };
    const result = generateFromTemplate(template, { DB_HOST: 'localhost' });
    expect(result.DEBUG).toBe('false');
  });

  it('should not override provided values with defaults', () => {
    const template = {
      keys: ['DB_HOST', 'DEBUG'],
      required: ['DB_HOST'],
      optional: ['DEBUG'],
      defaults: { DEBUG: 'false' },
    };
    const result = generateFromTemplate(template, { DB_HOST: 'localhost', DEBUG: 'true' });
    expect(result.DEBUG).toBe('true');
  });
});

describe('validateAgainstTemplate', () => {
  it('should return no errors when all required keys are present', () => {
    const template = {
      keys: ['DB_HOST'],
      required: ['DB_HOST'],
      optional: [],
      defaults: {},
    };
    const errors = validateAgainstTemplate(template, { DB_HOST: 'localhost' });
    expect(errors).toHaveLength(0);
  });

  it('should return errors for missing required keys', () => {
    const template = {
      keys: ['DB_HOST', 'API_KEY'],
      required: ['DB_HOST', 'API_KEY'],
      optional: [],
      defaults: {},
    };
    const errors = validateAgainstTemplate(template, { DB_HOST: 'localhost' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/API_KEY/);
  });

  it('should return errors for all missing required keys', () => {
    const template = {
      keys: ['DB_HOST', 'API_KEY', 'SECRET'],
      required: ['DB_HOST', 'API_KEY', 'SECRET'],
      optional: [],
      defaults: {},
    };
    const errors = validateAgainstTemplate(template, {});
    expect(errors).toHaveLength(3);
  });
});

describe('serializeTemplate / deserializeTemplate', () => {
  it('should round-trip a template object', () => {
    const template = {
      keys: ['FOO', 'BAR'],
      required: ['FOO'],
      optional: ['BAR'],
      defaults: { BAR: 'baz' },
    };
    const serialized = serializeTemplate(template);
    const deserialized = deserializeTemplate(serialized);
    expect(deserialized).toEqual(template);
  });
});
