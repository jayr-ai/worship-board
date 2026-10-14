import { describe, expect, it } from 'vitest';
import { faderValueToGain, dbToGain, FADER_TAPER_EXPONENT } from './taper';

describe('faderValueToGain', () => {
  it('is true silence at 0', () => {
    expect(faderValueToGain(0)).toBe(0);
  });

  it('is unity at 1', () => {
    expect(faderValueToGain(1)).toBe(1);
  });

  it('follows the value-squared taper', () => {
    expect(FADER_TAPER_EXPONENT).toBe(2);
    expect(faderValueToGain(0.5)).toBeCloseTo(0.25, 10);
    expect(faderValueToGain(0.2)).toBeCloseTo(0.04, 10);
  });

  it('clamps out-of-range input instead of extrapolating', () => {
    expect(faderValueToGain(-0.5)).toBe(0);
    expect(faderValueToGain(1.5)).toBe(1);
  });
});

describe('dbToGain', () => {
  it('is unity at 0 dB', () => {
    expect(dbToGain(0)).toBe(1);
  });

  it('matches the standard -6 dB ~= half-power point', () => {
    expect(dbToGain(-6)).toBeCloseTo(0.5012, 3);
  });

  it('is symmetric in log space', () => {
    expect(dbToGain(6) * dbToGain(-6)).toBeCloseTo(1, 5);
  });
});
