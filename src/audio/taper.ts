// Starting taper curve for every fader (sections 1-4 and master). Kept as a
// single constant so it's easy to tune after testing on the iPad.
export const FADER_TAPER_EXPONENT = 2;

export function faderValueToGain(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped === 0 ? 0 : clamped ** FADER_TAPER_EXPONENT;
}
