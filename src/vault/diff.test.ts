import { computeEnvDiff, formatDiff, diffSummary } from './diff';

describe('computeEnvDiff', () => {
  it('detects added keys', () => {
    const diff = computeEnvDiff('A=1', 'A=1\nB=2');
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toMatchObject({ key: 'B', type: 'added', newValue: '2' });
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects removed keys', () => {
    const diff = computeEnvDiff('A=1\nB=2', 'A=1');
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]).toMatchObject({ key: 'B', type: 'removed', oldValue: '2' });
  });

  it('detects changed keys', () => {
    const diff = computeEnvDiff('A=1', 'A=2');
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]).toMatchObject({ key: 'A', type: 'changed', oldValue: '1', newValue: '2' });
  });

  it('detects unchanged keys', () => {
    const diff = computeEnvDiff('A=1\nB=2', 'A=1\nB=2');
    expect(diff.unchanged).toHaveLength(2);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('handles empty envs', () => {
    const diff = computeEnvDiff('', '');
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });
});

describe('formatDiff', () => {
  it('masks values by default', () => {
    const diff = computeEnvDiff('A=secret', 'A=other');
    const output = formatDiff(diff);
    expect(output).toContain('***');
    expect(output).not.toContain('secret');
    expect(output).not.toContain('other');
  });

  it('shows values when masking disabled', () => {
    const diff = computeEnvDiff('A=1', 'A=2');
    const output = formatDiff(diff, false);
    expect(output).toContain('1');
    expect(output).toContain('2');
  });

  it('returns no differences message for identical envs', () => {
    const diff = computeEnvDiff('A=1', 'A=1');
    expect(formatDiff(diff)).toBe('No differences found.');
  });
});

describe('diffSummary', () => {
  it('summarizes differences', () => {
    const diff = computeEnvDiff('A=1\nC=3', 'A=2\nB=2');
    const summary = diffSummary(diff);
    expect(summary).toContain('added');
    expect(summary).toContain('removed');
    expect(summary).toContain('changed');
  });

  it('returns identical for no differences', () => {
    const diff = computeEnvDiff('A=1', 'A=1');
    expect(diffSummary(diff)).toBe('identical');
  });
});
