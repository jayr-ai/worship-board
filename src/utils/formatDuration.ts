export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  // Round the whole duration first so a remainder like 59.6s doesn't round
  // up to a literal "60" seconds display.
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
