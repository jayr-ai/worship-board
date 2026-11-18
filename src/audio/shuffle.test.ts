import { describe, expect, it } from 'vitest';
import { shuffleIds } from './shuffle';

describe('shuffleIds', () => {
  it('returns every input id exactly once, just reordered', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const result = shuffleIds(ids);
    expect(result).toHaveLength(ids.length);
    expect([...result].sort()).toEqual([...ids].sort());
  });

  it('does not mutate the input array', () => {
    const ids = ['a', 'b', 'c'];
    const copy = [...ids];
    shuffleIds(ids);
    expect(ids).toEqual(copy);
  });

  it('handles empty and single-item arrays without error', () => {
    expect(shuffleIds([])).toEqual([]);
    expect(shuffleIds(['only'])).toEqual(['only']);
  });
});
