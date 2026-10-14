// Procedurally synthesized demo SFX (section 9: no bundled audio files).
// Each generator returns a mono AudioBuffer rendered once and cached.

function noiseBuffer(ctx: AudioContext | OfflineAudioContext, durationSec: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

async function render(
  durationSec: number,
  sampleRate: number,
  build: (ctx: OfflineAudioContext) => void,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, Math.ceil(sampleRate * durationSec), sampleRate);
  build(ctx);
  return ctx.startRendering();
}

function envelope(
  gain: GainNode,
  peak: number,
  attack: number,
  release: number,
  startAt = 0,
) {
  const g = gain.gain;
  g.setValueAtTime(0, startAt);
  g.linearRampToValueAtTime(peak, startAt + attack);
  g.exponentialRampToValueAtTime(0.0001, startAt + attack + release);
}

async function clap(sampleRate: number): Promise<AudioBuffer> {
  return render(0.3, sampleRate, (ctx) => {
    for (let burst = 0; burst < 3; burst++) {
      const start = burst * 0.018;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 0.08);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1500;
      bandpass.Q.value = 0.8;
      const gain = ctx.createGain();
      envelope(gain, 0.9, 0.002, 0.07, start);
      src.connect(bandpass).connect(gain).connect(ctx.destination);
      src.start(start);
    }
  });
}

async function airHorn(sampleRate: number): Promise<AudioBuffer> {
  return render(1.4, sampleRate, (ctx) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(230, 0);
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(345, 0);
    const gain = ctx.createGain();
    envelope(gain, 0.55, 0.05, 1.2, 0);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(0);
    osc1.stop(1.3);
    osc2.start(0);
    osc2.stop(1.3);
  });
}

async function drumRoll(sampleRate: number): Promise<AudioBuffer> {
  return render(1.2, sampleRate, (ctx) => {
    const hits = 24;
    for (let i = 0; i < hits; i++) {
      const start = (i / hits) ** 1.6 * 1.0;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 0.05);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 220;
      bandpass.Q.value = 1.2;
      const gain = ctx.createGain();
      envelope(gain, 0.5, 0.001, 0.04, start);
      src.connect(bandpass).connect(gain).connect(ctx.destination);
      src.start(start);
    }
  });
}

async function whoosh(sampleRate: number): Promise<AudioBuffer> {
  return render(0.8, sampleRate, (ctx) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.8);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(300, 0);
    filter.frequency.linearRampToValueAtTime(3200, 0.35);
    filter.frequency.linearRampToValueAtTime(400, 0.8);
    const gain = ctx.createGain();
    envelope(gain, 0.6, 0.1, 0.65, 0);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(0);
  });
}

async function kick(sampleRate: number): Promise<AudioBuffer> {
  return render(0.4, sampleRate, (ctx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, 0);
    osc.frequency.exponentialRampToValueAtTime(45, 0.22);
    const gain = ctx.createGain();
    envelope(gain, 1, 0.002, 0.3, 0);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.38);
  });
}

async function snare(sampleRate: number): Promise<AudioBuffer> {
  return render(0.35, sampleRate, (ctx) => {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.2);
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 900;
    const noiseGain = ctx.createGain();
    envelope(noiseGain, 0.7, 0.002, 0.16, 0);
    noise.connect(highpass).connect(noiseGain).connect(ctx.destination);
    noise.start(0);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, 0);
    const oscGain = ctx.createGain();
    envelope(oscGain, 0.4, 0.002, 0.1, 0);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.12);
  });
}

const GENERATORS: Record<string, (sampleRate: number) => Promise<AudioBuffer>> = {
  'demo-sfx-0': clap,
  'demo-sfx-1': airHorn,
  'demo-sfx-2': drumRoll,
  'demo-sfx-3': whoosh,
  'demo-sfx-4': kick,
  'demo-sfx-5': snare,
};

const cache = new Map<string, AudioBuffer>();

export async function getDemoSfxBuffer(
  libraryId: string,
  sampleRate: number,
): Promise<AudioBuffer | null> {
  const cached = cache.get(libraryId);
  if (cached) return cached;

  const generator = GENERATORS[libraryId];
  if (!generator) return null;

  const buffer = await generator(sampleRate);
  cache.set(libraryId, buffer);
  return buffer;
}
