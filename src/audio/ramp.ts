// Every parameter change in the engine goes through here so nothing is ever
// set abruptly (clicks). Short linear ramps from the param's current value.
export function rampParam(
  param: AudioParam,
  value: number,
  ctx: AudioContext,
  ms = 8,
): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + ms / 1000);
}
