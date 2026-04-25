import { parseEnv, stringifyEnv, mergeEnv } from './envParser';

describe('parseEnv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnv('DB_HOST=localhost\nDB_PORT=5432');
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('ignores comments and blank lines', () => {
    const content = `# This is a comment\n\nAPI_KEY=secret`;
    expect(parseEnv(content)).toEqual({ API_KEY: 'secret' });
  });

  it('strips double-quoted values', () => {
    expect(parseEnv('NAME="John Doe"')).toEqual({ NAME: 'John Doe' });
  });

  it('strips single-quoted values', () => {
    expect(parseEnv("NAME='Jane'")).toEqual({ NAME: 'Jane' });
  });

  it('handles values with equals signs', () => {
    expect(parseEnv('URL=http://example.com?a=1')).toEqual({
      URL: 'http://example.com?a=1',
    });
  });
});

describe('stringifyEnv', () => {
  it('serializes a map to env format', () => {
    const result = stringifyEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const result = stringifyEnv({ NAME: 'John Doe' });
    expect(result).toBe('NAME="John Doe"');
  });
});

describe('mergeEnv', () => {
  it('merges two env maps with overrides winning', () => {
    const base = { A: '1', B: '2' };
    const overrides = { B: '99', C: '3' };
    expect(mergeEnv(base, overrides)).toEqual({ A: '1', B: '99', C: '3' });
  });
});
