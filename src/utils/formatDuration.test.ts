import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('shows sub-minute durations with one decimal and an "s" suffix', () => {
    expect(formatDuration(1.2)).toBe('1.2s');
    expect(formatDuration(59.9)).toBe('59.9s');
  });

  it('shows minute:second for a minute or more', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('carries a rounded 59.5-60s remainder into the next minute', () => {
    // 119.6s is 1m59.6s; rounding the seconds alone would wrongly print "1:60".
    expect(formatDuration(119.6)).toBe('2:00');
  });

  it('falls back to a placeholder for non-finite or non-positive input', () => {
    expect(formatDuration(0)).toBe('--:--');
    expect(formatDuration(-5)).toBe('--:--');
    expect(formatDuration(NaN)).toBe('--:--');
    expect(formatDuration(Infinity)).toBe('--:--');
  });
});
