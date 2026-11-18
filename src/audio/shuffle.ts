// Fisher-Yates shuffle, used to roll a fresh Background playlist order each
// time shuffle is turned on (AudioEngine.toggleBackgroundShuffle).
export function shuffleIds(ids: string[]): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
