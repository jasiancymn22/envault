import { lintEnvData, formatLintResults, LintResult } from './lint';

describe('lintEnvData', () => {
  it('returns no warnings for clean env data', () => {
    const raw = 'API_KEY=abc123\nDATABASE_URL=postgres://localhost/db';
    const result = lintEnvData('production', raw);
    expect(result.environment).toBe('production');
    expect(result.warnings).toHaveLength(0);
  });

  it('warns on empty values', () => {
    const raw = 'API_KEY=';
    const result = lintEnvData('staging', raw);
    expect(result.warnings.some((w) => w.rule === 'no-empty-value')).toBe(true);
  });

  it('warns on lowercase keys', () => {
    const raw = 'api_key=secret';
    const result = lintEnvData('dev', raw);
    expect(result.warnings.some((w) => w.rule === 'uppercase-key')).toBe(true);
  });

  it('warns on placeholder values', () => {
    const raw = 'SECRET=<YOUR_SECRET>';
    const result = lintEnvData('dev', raw);
    expect(result.warnings.some((w) => w.rule === 'no-placeholder-value')).toBe(true);
  });

  it('warns on double-quoted values', () => {
    const raw = 'TOKEN="mytoken"';
    const result = lintEnvData('dev', raw);
    expect(result.warnings.some((w) => w.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('supports custom rules', () => {
    const raw = 'MY_KEY=value';
    const customRule = {
      name: 'no-my-prefix',
      check: (key: string) =>
        key.startsWith('MY_') ? `Key "${key}" starts with MY_.` : null,
    };
    const result = lintEnvData('dev', raw, [customRule]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].rule).toBe('no-my-prefix');
  });
});

describe('formatLintResults', () => {
  it('shows success message when no warnings', () => {
    const results: LintResult[] = [{ environment: 'prod', warnings: [] }];
    const output = formatLintResults(results);
    expect(output).toContain('✔ [prod] No issues found.');
  });

  it('shows warning count and details', () => {
    const results: LintResult[] = [
      {
        environment: 'staging',
        warnings: [{ key: 'api_key', rule: 'uppercase-key', message: 'Key "api_key" should be uppercase.' }],
      },
    ];
    const output = formatLintResults(results);
    expect(output).toContain('⚠ [staging] 1 issue(s):');
    expect(output).toContain('[uppercase-key]');
  });
});
