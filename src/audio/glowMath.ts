// Pure glow-intensity math (section 5), isolated from glowEngine.ts so it's
// testable without pulling in the stateful audio engine or any DOM globals.
export const PULSE_PERIOD_SEC = 1.6;
export const PULSE_MIN = 0.75;
export const PULSE_MAX = 1;

export const FLASH_RISE_MS = 60;
export const FLASH_DECAY_MS = 450;
export const FLASH_TOTAL_MS = FLASH_RISE_MS + FLASH_DECAY_MS;

/** 0.75..1 sine breathing cycle, section 5.2's "~1.6s per cycle, ease-in-out". */
export function pulseFactor(nowMs: number): number {
  const phase = (nowMs / 1000 / PULSE_PERIOD_SEC) * Math.PI * 2;
  const t = (Math.sin(phase) + 1) / 2; // 0..1, smooth ease via sine
  return PULSE_MIN + t * (PULSE_MAX - PULSE_MIN);
}

/** 0->1 over FLASH_RISE_MS, then ease-out decay to 0 over FLASH_DECAY_MS,
 * independent of the sample's real length (section 5.4). */
export function flashFactor(elapsedMs: number): number {
  if (elapsedMs < FLASH_RISE_MS) return elapsedMs / FLASH_RISE_MS;
  const t = Math.min(1, (elapsedMs - FLASH_RISE_MS) / FLASH_DECAY_MS);
  return (1 - t) ** 3; // ease-out decay
}
