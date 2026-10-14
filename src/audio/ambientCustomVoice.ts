// A custom-audio Ambient voice (section 4.4's "custom pad pack"): a key
// that's been given its own imported recording instead of the built-in
// synth. Implements the same AmbientVoiceLike surface as AmbientVoice so
// the engine's crossfade and glow-level code doesn't need to care which
// kind is currently sounding.
import type { AmbientVoiceLike } from './ambientSynth';

const DEFAULT_ATTACK_SEC = 2.5;
const DEFAULT_RELEASE_SEC = 3;

export class CustomAmbientVoice implements AmbientVoiceLike {
  private ctx: AudioContext;
  private source: AudioBufferSourceNode;
  private envelope: GainNode;
  private peakGain: number;
  private released = false;
  private started = false;

  constructor(ctx: AudioContext, buffer: AudioBuffer, peakGain: number, destination: AudioNode) {
    this.ctx = ctx;
    this.peakGain = peakGain;

    this.envelope = ctx.createGain();
    this.envelope.gain.value = 0;
    this.envelope.connect(destination);

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    // Section 4.4: "Custom pad files loop seamlessly" is the ideal/primary
    // case this targets; a ~1.5s crossfade for files not prepared as loops
    // is a further refinement not implemented yet (see README).
    this.source.loop = true;
    this.source.connect(this.envelope);
  }

  get releaseSec(): number {
    return DEFAULT_RELEASE_SEC;
  }

  attack(durationSec = DEFAULT_ATTACK_SEC): void {
    if (!this.started) {
      this.started = true;
      this.source.start();
    }
    const now = this.ctx.currentTime;
    const g = this.envelope.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(this.peakGain, now + durationSec);
  }

  release(durationSec = DEFAULT_RELEASE_SEC): void {
    if (this.released) return;
    this.released = true;
    const now = this.ctx.currentTime;
    const g = this.envelope.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + durationSec);

    try {
      this.source.stop(now + durationSec + 0.05);
    } catch {
      /* not started yet, or already stopped */
    }
    window.setTimeout(() => this.dispose(), (durationSec + 0.1) * 1000);
  }

  /** Normalized 0..1 against this voice's own peak, same convention as
   * clips/SFX, so the glow loop doesn't need to know which kind this is. */
  getLevel(): number {
    return this.peakGain > 0 ? Math.min(1, this.envelope.gain.value / this.peakGain) : 0;
  }

  dispose(): void {
    try {
      this.source.disconnect();
    } catch {
      /* already disconnected */
    }
    this.envelope.disconnect();
  }
}
