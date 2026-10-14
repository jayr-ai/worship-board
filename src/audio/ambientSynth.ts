// Built-in warm pad synth (section 4.4). Framework-free; the engine owns
// the only instance and the UI only ever sees "which key is sounding".

export type AmbientQuality = 'major' | 'minor';
export type AmbientPack = 'warm' | 'airy';

const NOTE_SEMITONES: Record<string, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

const ROOT_OCTAVE = 3; // C3 ~ 130.8 Hz, a comfortable pad register

function noteToFrequency(key: string, semitoneOffset: number): number {
  const base = NOTE_SEMITONES[key] ?? 0;
  const midiNote = 12 * (ROOT_OCTAVE + 1) + base + semitoneOffset;
  return 440 * 2 ** ((midiNote - 69) / 12);
}

interface PackDefinition {
  filterFreq: number;
  lfoDepth: number;
  lfoRate: number;
  reverbWet: number;
  attack: number;
  release: number;
  oscGain: number;
}

const PACKS: Record<AmbientPack, PackDefinition> = {
  warm: { filterFreq: 900, lfoDepth: 200, lfoRate: 0.13, reverbWet: 0.35, attack: 2.5, release: 3, oscGain: 0.1 },
  airy: { filterFreq: 1800, lfoDepth: 300, lfoRate: 0.18, reverbWet: 0.55, attack: 2.5, release: 3, oscGain: 0.085 },
};

// Pitch layers: root carries a doubled sub-octave layer, plus third/fifth/octave-up.
const PITCH_OFFSETS = (quality: AmbientQuality) => [
  -12, // sub-octave root
  0, // root
  quality === 'major' ? 4 : 3, // third
  7, // fifth
  12, // root one octave up
];

const DETUNE_CENTS = 6;

interface VoiceNodes {
  oscillators: OscillatorNode[];
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  envelope: GainNode;
  dryGain: GainNode;
  wetSendGain: GainNode;
}

export class AmbientVoice {
  private ctx: AudioContext;
  private nodes: VoiceNodes;
  private pack: PackDefinition;
  private released = false;

  constructor(
    ctx: AudioContext,
    key: string,
    quality: AmbientQuality,
    pack: AmbientPack,
    dryDestination: AudioNode,
    reverbSendDestination: AudioNode,
  ) {
    this.ctx = ctx;
    this.pack = PACKS[pack];

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.pack.filterFreq;
    filter.Q.value = 0.3;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = this.pack.lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = this.pack.lfoDepth;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    const envelope = ctx.createGain();
    envelope.gain.value = 0;
    filter.connect(envelope);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - this.pack.reverbWet;
    const wetSendGain = ctx.createGain();
    wetSendGain.gain.value = this.pack.reverbWet;
    envelope.connect(dryGain).connect(dryDestination);
    envelope.connect(wetSendGain).connect(reverbSendDestination);

    const oscillators: OscillatorNode[] = [];
    for (const offset of PITCH_OFFSETS(quality)) {
      const freq = noteToFrequency(key, offset);
      for (const [type, detune] of [
        ['sawtooth', -DETUNE_CENTS],
        ['triangle', DETUNE_CENTS],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const gain = ctx.createGain();
        gain.gain.value = this.pack.oscGain;
        osc.connect(gain).connect(filter);
        osc.start();
        oscillators.push(osc);
      }
    }

    this.nodes = { oscillators, filter, lfo, lfoGain, envelope, dryGain, wetSendGain };
  }

  attack(durationSec = this.pack.attack): void {
    const now = this.ctx.currentTime;
    const g = this.nodes.envelope.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + durationSec);
  }

  /** Fade to silence over durationSec, then free all nodes. */
  release(durationSec = this.pack.release): void {
    if (this.released) return;
    this.released = true;
    const now = this.ctx.currentTime;
    const g = this.nodes.envelope.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + durationSec);

    const stopAt = now + durationSec + 0.05;
    for (const osc of [...this.nodes.oscillators, this.nodes.lfo]) {
      osc.stop(stopAt);
    }
    window.setTimeout(() => this.dispose(), (durationSec + 0.1) * 1000);
  }

  /** Normalized 0..1 level of the voice's current envelope, for the glow system. */
  getLevel(): number {
    return this.nodes.envelope.gain.value;
  }

  dispose(): void {
    for (const osc of [...this.nodes.oscillators, this.nodes.lfo]) {
      try {
        osc.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    this.nodes.filter.disconnect();
    this.nodes.envelope.disconnect();
    this.nodes.dryGain.disconnect();
    this.nodes.wetSendGain.disconnect();
    this.nodes.lfoGain.disconnect();
  }
}
