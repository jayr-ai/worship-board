import { describe, expect, it } from 'vitest';
import { computePeaks } from './peaks';

function fakeBuffer(samples: number[]): AudioBuffer {
  const data = Float32Array.from(samples);
  return { getChannelData: () => data } as unknown as AudioBuffer;
}

describe('computePeaks', () => {
  it('returns bucketCount entries regardless of input length', () => {
    const buffer = fakeBuffer(new Array(10_000).fill(0).map(() => Math.random() * 2 - 1));
    expect(computePeaks(buffer, 100)).toHaveLength(100);
  });

  it('captures the max absolute amplitude per bucket, not the average', () => {
    // Two buckets of 4 samples each; a single spike should dominate its bucket.
    const buffer = fakeBuffer([0, 0, 0.9, 0, /* bucket 2 */ 0.1, 0.1, 0.1, 0.1]);
    const peaks = computePeaks(buffer, 2);
    expect(peaks[0]).toBeCloseTo(0.9, 5);
    expect(peaks[1]).toBeCloseTo(0.1, 5);
  });

  it('treats negative excursions the same as positive ones', () => {
    const buffer = fakeBuffer([0, -0.7, 0, 0]);
    const peaks = computePeaks(buffer, 1);
    expect(peaks[0]).toBeCloseTo(0.7, 5);
  });

  it('handles a buffer shorter than the bucket count without throwing', () => {
    const buffer = fakeBuffer([0.3, 0.6]);
    const peaks = computePeaks(buffer, 10);
    expect(peaks).toHaveLength(10);
  });
});
