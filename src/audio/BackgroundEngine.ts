// A reusable two-deck <audio> player, each routed into the Web Audio graph
// via createMediaElementSource so a bus's fader/mute/duck apply to it, with
// an equal-power crossfade between them (6.3). Used for both the Background
// section's pad-based player and the Ambient Pads folder-scoped player -
// state writes go through the onStateChange/onLoopChange callbacks instead
// of a hardcoded store, so two independent instances don't stomp on the
// same playback state.
import type { PadAssignment } from '../types';

const DEFAULT_CROSSFADE_SEC = 4;
const STOP_FADE_SEC = 1;

interface Deck {
  audio: HTMLAudioElement;
  gain: GainNode;
}

function equalPowerCrossfade(
  outGain: GainNode,
  inGain: GainNode,
  ctx: AudioContext,
  durationSec: number,
  inPeak: number,
): void {
  const steps = 50;
  const now = ctx.currentTime;
  const outCurve = new Float32Array(steps + 1);
  const inCurve = new Float32Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    outCurve[i] = Math.cos((x * Math.PI) / 2);
    inCurve[i] = Math.sin((x * Math.PI) / 2) * inPeak;
  }
  outGain.gain.cancelScheduledValues(now);
  outGain.gain.setValueCurveAtTime(outCurve, now, durationSec);
  inGain.gain.cancelScheduledValues(now);
  inGain.gain.setValueCurveAtTime(inCurve, now, durationSec);
}

export class BackgroundEngine {
  private ctx: AudioContext;
  private decks: [Deck, Deck];
  private activeDeckIndex = 0;
  private currentPadId: string | null = null;
  private looping = false;
  /** Which pad each deck is currently loaded with, and that pad's target
   * (trim-adjusted) peak gain - lets the glow loop read a 0..1 level for
   * both decks during a crossfade handoff (5.3). */
  private deckPadId: [string | null, string | null] = [null, null];
  private deckTargetGain: [number, number] = [1, 1];
  private onEnded?: (endedLibraryId: string) => void;
  private onStateChange: (padId: string | null, playing: boolean) => void;
  private onLoopChange: (looping: boolean) => void;

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    onStateChange: (padId: string | null, playing: boolean) => void,
    onLoopChange: (looping: boolean) => void,
    onEnded?: (endedLibraryId: string) => void,
  ) {
    this.ctx = ctx;
    this.onStateChange = onStateChange;
    this.onLoopChange = onLoopChange;
    this.onEnded = onEnded;
    this.decks = [this.createDeck(destination), this.createDeck(destination)];
  }

  private createDeck(destination: AudioNode): Deck {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    const source = this.ctx.createMediaElementSource(audio);
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(destination);

    audio.addEventListener('ended', () => {
      if (!audio.loop) this.handleEnded(audio);
    });

    return { audio, gain };
  }

  private handleEnded(audio: HTMLAudioElement): void {
    const active = this.decks[this.activeDeckIndex];
    if (active.audio !== audio) return;
    const endedId = this.currentPadId;
    this.currentPadId = null;
    this.onStateChange(null, false);
    // Auto-advance to the next song in the playlist (the caller - see
    // AudioEngine.nextBackgroundSong - decides what "next" means, e.g.
    // respecting shuffle); this engine only knows playback finished.
    if (endedId) this.onEnded?.(endedId);
  }

  get playingPadId(): string | null {
    return this.currentPadId;
  }

  /** 0..1 level for a given pad, normalized against its own target gain, so
   * the glow loop sees both decks during a crossfade handoff. */
  getPadLevel(padId: string): number {
    for (let i = 0; i < 2; i++) {
      if (this.deckPadId[i] === padId) {
        const target = this.deckTargetGain[i] || 1;
        return Math.min(1, this.decks[i].gain.gain.value / target);
      }
    }
    return 0;
  }

  /** Tap a Background pad: starts it, crossfades from whatever's playing, or
   * stops it if it's the pad already sounding - unless `forceRestart` is
   * set, which Next/Previous use so a single-song playlist (where "next"
   * lands back on the same id) restarts the song instead of stopping it. */
  async playPad(
    pad: PadAssignment,
    blobUrl: string,
    targetGain = 1,
    crossfadeSec = DEFAULT_CROSSFADE_SEC,
    forceRestart = false,
  ): Promise<void> {
    if (this.currentPadId === pad.id && !forceRestart) {
      this.stop();
      return;
    }

    const hadPrevious = this.currentPadId !== null;
    const previousDeck = this.decks[this.activeDeckIndex];
    const nextIndex = hadPrevious ? 1 - this.activeDeckIndex : this.activeDeckIndex;
    const nextDeck = this.decks[nextIndex];

    const loop = pad.tag === 'LOOP';
    nextDeck.audio.src = blobUrl;
    nextDeck.audio.loop = loop;
    nextDeck.audio.currentTime = 0;
    this.looping = loop;
    this.onLoopChange(loop);
    // Cancel first: a rapid re-trigger can land on a deck that still has a
    // setValueCurveAtTime automation in flight from its last crossfade, and
    // setValueAtTime on top of that throws NotSupportedError.
    nextDeck.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    nextDeck.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    await nextDeck.audio.play();

    this.deckPadId[nextIndex] = pad.id;
    this.deckTargetGain[nextIndex] = targetGain;

    if (hadPrevious) {
      equalPowerCrossfade(previousDeck.gain, nextDeck.gain, this.ctx, crossfadeSec, targetGain);
      const previousAudio = previousDeck.audio;
      window.setTimeout(() => previousAudio.pause(), crossfadeSec * 1000 + 50);
    } else {
      nextDeck.gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }

    this.activeDeckIndex = nextIndex;
    this.currentPadId = pad.id;
    this.onStateChange(pad.id, true);
  }

  stop(fadeSec = STOP_FADE_SEC): void {
    if (!this.currentPadId) return;
    const deck = this.decks[this.activeDeckIndex];
    const now = this.ctx.currentTime;
    deck.gain.gain.cancelScheduledValues(now);
    deck.gain.gain.setValueAtTime(deck.gain.gain.value, now);
    deck.gain.gain.linearRampToValueAtTime(0, now + fadeSec);
    const audio = deck.audio;
    window.setTimeout(() => audio.pause(), fadeSec * 1000 + 50);
    this.currentPadId = null;
    this.onStateChange(null, false);
  }

  /** Immediate stop for the global Stop All control. */
  hardStop(): void {
    for (const deck of this.decks) {
      deck.audio.pause();
      deck.gain.gain.cancelScheduledValues(this.ctx.currentTime);
      deck.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.currentPadId = null;
    this.onStateChange(null, false);
  }

  togglePlayPause(): void {
    if (!this.currentPadId) return;
    const audio = this.decks[this.activeDeckIndex].audio;
    if (audio.paused) {
      void audio.play();
      this.onStateChange(this.currentPadId, true);
    } else {
      audio.pause();
      this.onStateChange(this.currentPadId, false);
    }
  }

  toggleLoop(): void {
    this.looping = !this.looping;
    this.decks[this.activeDeckIndex].audio.loop = this.looping;
    this.onLoopChange(this.looping);
  }
}
