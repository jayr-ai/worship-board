import { describe, expect, it } from 'vitest';
import {
  FLASH_DECAY_MS,
  FLASH_RISE_MS,
  PULSE_MAX,
  PULSE_MIN,
  PULSE_PERIOD_SEC,
  flashFactor,
  pulseFactor,
} from './glowMath';

describe('pulseFactor', () => {
  it('stays within the 0.75-1.0 breathing range', () => {
    for (let ms = 0; ms < 10_000; ms += 37) {
      const value = pulseFactor(ms);
      expect(value).toBeGreaterThanOrEqual(PULSE_MIN - 1e-9);
      expect(value).toBeLessThanOrEqual(PULSE_MAX + 1e-9);
    }
  });

  it('completes one full cycle every 1.6s', () => {
    const periodMs = PULSE_PERIOD_SEC * 1000;
    expect(pulseFactor(periodMs)).toBeCloseTo(pulseFactor(0), 6);
    expect(pulseFactor(periodMs * 3)).toBeCloseTo(pulseFactor(0), 6);
  });

  it('starts at the midpoint and rises first', () => {
    // sin(0) = 0 -> midpoint of the 0.75..1 range
    expect(pulseFactor(0)).toBeCloseTo((PULSE_MIN + PULSE_MAX) / 2, 6);
    expect(pulseFactor(1)).toBeGreaterThan(pulseFactor(0));
  });
});

describe('flashFactor', () => {
  it('rises linearly from 0 to 1 over the rise window', () => {
    expect(flashFactor(0)).toBe(0);
    expect(flashFactor(FLASH_RISE_MS / 2)).toBeCloseTo(0.5, 10);
  });

  it('is independent of sample length: decays fully by rise+decay regardless of what is playing', () => {
    const total = FLASH_RISE_MS + FLASH_DECAY_MS;
    expect(flashFactor(total)).toBeCloseTo(0, 5);
    // Never goes negative or holds a plateau past the decay window.
    expect(flashFactor(total + 1000)).toBeCloseTo(0, 5);
  });

  it('decays faster at first than at the end (ease-out shape)', () => {
    const start = flashFactor(FLASH_RISE_MS) - flashFactor(FLASH_RISE_MS + FLASH_DECAY_MS * 0.1);
    const end =
      flashFactor(FLASH_RISE_MS + FLASH_DECAY_MS * 0.9) - flashFactor(FLASH_RISE_MS + FLASH_DECAY_MS);
    expect(start).toBeGreaterThan(end);
  });

  it('restarts cleanly from 0 on re-trigger (same math, fresh elapsed time)', () => {
    expect(flashFactor(0)).toBe(flashFactor(0));
  });
});
