import { describe, expect, it } from 'vitest';
import { computeFadeSchedule } from './envelope';

describe('computeFadeSchedule', () => {
  it('starts the fade so it finishes exactly at the clip end', () => {
    const { fadeOutSec, fadeStartSec } = computeFadeSchedule(18, 3);
    expect(fadeOutSec).toBe(3);
    expect(fadeStartSec).toBe(15);
    expect(fadeStartSec + fadeOutSec).toBe(18);
  });

  it('clamps a fade-out longer than the clip itself to the clip length', () => {
    // A 2s clip with a requested 5s fade-out should fade across its entire length.
    const { fadeOutSec, fadeStartSec } = computeFadeSchedule(2, 5);
    expect(fadeOutSec).toBe(2);
    expect(fadeStartSec).toBe(0);
  });

  it('never returns a negative fade-out for a negative request', () => {
    const { fadeOutSec, fadeStartSec } = computeFadeSchedule(10, -3);
    expect(fadeOutSec).toBe(0);
    expect(fadeStartSec).toBe(10);
  });

  it('handles a zero-length clip without producing NaN', () => {
    const { fadeOutSec, fadeStartSec } = computeFadeSchedule(0, 3);
    expect(fadeOutSec).toBe(0);
    expect(fadeStartSec).toBe(0);
  });
});
