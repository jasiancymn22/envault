import { parseEnv } from './envParser';

export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  environment: string;
  warnings: Array<{ key: string; rule: string; message: string }>;
}

const defaultRules: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value.` : null,
  },
  {
    name: 'uppercase-key',
    check: (key) =>
      key !== key.toUpperCase() ? `Key "${key}" should be uppercase.` : null,
  },
  {
    name: 'no-whitespace-in-key',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace.` : null,
  },
  {
    name: 'no-quotes-in-value',
    check: (key, value) =>
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? `Key "${key}" value appears to be double-quoted; quotes may be literal.`
        : null,
  },
  {
    name: 'no-placeholder-value',
    check: (key, value) =>
      /^<.+>$|^\{\{.+\}\}$|^YOUR_/.test(value)
        ? `Key "${key}" looks like a placeholder value.`
        : null,
  },
];

export function lintEnvData(
  environment: string,
  rawEnv: string,
  rules: LintRule[] = defaultRules
): LintResult {
  const parsed = parseEnv(rawEnv);
  const warnings: LintResult['warnings'] = [];

  for (const [key, value] of Object.entries(parsed)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        warnings.push({ key, rule: rule.name, message });
      }
    }
  }

  return { environment, warnings };
}

export function formatLintResults(results: LintResult[]): string {
  const lines: string[] = [];
  for (const result of results) {
    if (result.warnings.length === 0) {
      lines.push(`✔ [${result.environment}] No issues found.`);
    } else {
      lines.push(`⚠ [${result.environment}] ${result.warnings.length} issue(s):`);
      for (const w of result.warnings) {
        lines.push(`  [${w.rule}] ${w.message}`);
      }
    }
  }
  return lines.join('\n');
}
