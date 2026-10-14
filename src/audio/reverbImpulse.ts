// Procedurally generated convolution reverb impulse (no bundled audio file,
// so the ambient pad works fully offline from first load).
export function createReverbImpulse(
  ctx: AudioContext,
  durationSec = 3.5,
  decay = 3.2,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSec);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) ** decay;
    }
  }

  return impulse;
}
