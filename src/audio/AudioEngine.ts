import type { PadAssignment, SectionId, TriggerMode } from '../types';
import { useUIStore } from '../store/useUIStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { faderValueToGain } from './taper';
import { rampParam } from './ramp';
import { createReverbImpulse } from './reverbImpulse';
import { getDemoSfxBuffer } from './sfxBuffers';
import { AmbientVoice, type AmbientPack } from './ambientSynth';
import { WakeLockManager } from './wakeLock';
import { createSilentAudioElement } from './silentAudio';

const FADE_ALL_SEC = 3;
const STOP_ALL_MS = 80;
const AMBIENT_FADE_OUT_SEC = 4;
const AMBIENT_CROSSFADE_SEC = 2;
const RAMP_MS = 8;

interface Bus {
  input: GainNode;
  duck?: GainNode;
  fader: GainNode;
  mute: GainNode;
}

interface ActiveSfxVoice {
  source: AudioBufferSourceNode;
  envelope: GainNode;
  mode: TriggerMode;
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private limiter!: DynamicsCompressorNode;
  private buses!: Record<SectionId, Bus>;
  private reverbConvolver!: ConvolverNode;
  private sfxVoices = new Map<string, ActiveSfxVoice>();
  private currentAmbientVoice: AmbientVoice | null = null;
  private ambientPack: AmbientPack = 'warm';
  private silentAudio: HTMLAudioElement | null = null;
  private wakeLock = new WakeLockManager();
  private globalUnlockBound = false;

  bindGlobalUnlock(): void {
    if (this.globalUnlockBound) return;
    this.globalUnlockBound = true;
    const handler = () => {
      void this.ensureStarted();
      window.removeEventListener('pointerdown', handler);
    };
    window.addEventListener('pointerdown', handler);
  }

  /** Creates the AudioContext and graph on first use, resumes it otherwise. */
  async ensureStarted(): Promise<void> {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      this.ctx = ctx;
      this.buildGraph(ctx);
      this.applyCurrentLevels(true);
      useUIStore.subscribe(() => {
        this.applyCurrentLevels(false);
      });

      this.silentAudio = createSilentAudioElement();
      this.silentAudio.play().catch(() => {});

      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) {
        try {
          nav.audioSession.type = 'playback';
        } catch {
          /* unsupported on this browser */
        }
      }

      ctx.addEventListener('statechange', () => {
        if (ctx.state === 'running') {
          usePlaybackStore.getState().setNeedsTapToResume(false);
        } else if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
          usePlaybackStore.getState().setNeedsTapToResume(true);
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void ctx.resume();
      });

      this.wakeLock.onUnsupported = () =>
        usePlaybackStore.getState().setWakeLockUnsupported(true);
      void this.wakeLock.acquire();

      usePlaybackStore.getState().setAudioUnlocked(true);
    }

    if (this.ctx.state !== 'running') {
      await this.ctx.resume();
    }
    this.silentAudio?.play().catch(() => {});
  }

  private buildGraph(ctx: AudioContext): void {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = faderValueToGain(useUIStore.getState().levels.master);

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;

    this.masterGain.connect(this.limiter);
    this.limiter.connect(ctx.destination);

    this.buses = {
      clips: this.createBus(ctx, false),
      sfx: this.createBus(ctx, false),
      bg: this.createBus(ctx, true),
      ambient: this.createBus(ctx, false),
    };

    this.reverbConvolver = ctx.createConvolver();
    this.reverbConvolver.buffer = createReverbImpulse(ctx);
    this.reverbConvolver.connect(this.buses.ambient.input);
  }

  private createBus(ctx: AudioContext, withDuck: boolean): Bus {
    const input = ctx.createGain();
    input.gain.value = 1;

    let node: AudioNode = input;
    let duck: GainNode | undefined;
    if (withDuck) {
      duck = ctx.createGain();
      duck.gain.value = 1;
      node.connect(duck);
      node = duck;
    }

    const fader = ctx.createGain();
    fader.gain.value = 1;
    node.connect(fader);

    const mute = ctx.createGain();
    mute.gain.value = 1;
    fader.connect(mute);
    mute.connect(this.masterGain);

    return { input, duck, fader, mute };
  }

  private applyCurrentLevels(immediate: boolean): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { levels, muted } = useUIStore.getState();
    const ms = immediate ? 0 : RAMP_MS;

    const setGain = (param: AudioParam, value: number) => {
      if (immediate) {
        param.setValueAtTime(value, ctx.currentTime);
      } else {
        rampParam(param, value, ctx, ms);
      }
    };

    (Object.keys(this.buses) as SectionId[]).forEach((section) => {
      setGain(this.buses[section].fader.gain, faderValueToGain(levels[section]));
      setGain(this.buses[section].mute.gain, muted[section] ? 0 : 1);
    });
    setGain(this.masterGain.gain, faderValueToGain(levels.master));
  }

  // ---- Sound Effects (section 2) ----------------------------------------

  async triggerSfxDown(pad: PadAssignment): Promise<void> {
    if (!pad.libraryId) return;
    await this.ensureStarted();
    const ctx = this.ctx!;
    const mode: TriggerMode = pad.mode ?? 'oneshot';
    const existing = this.sfxVoices.get(pad.id);

    if ((mode === 'loop' || mode === 'toggle') && existing) {
      this.stopSfxVoice(pad.id, 0.05);
      return;
    }
    if (existing) {
      this.stopSfxVoice(pad.id, 0.005);
    }

    const buffer = await getDemoSfxBuffer(pad.libraryId, ctx.sampleRate);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = mode !== 'oneshot';

    const envelope = ctx.createGain();
    envelope.gain.value = 1;
    source.connect(envelope).connect(this.buses.sfx.input);
    source.start();

    this.sfxVoices.set(pad.id, { source, envelope, mode });
    usePlaybackStore.getState().setSfxActive(pad.id, true);

    if (mode === 'oneshot') {
      source.onended = () => {
        this.sfxVoices.delete(pad.id);
        usePlaybackStore.getState().setSfxActive(pad.id, false);
      };
    }
  }

  triggerSfxUp(padId: string): void {
    const voice = this.sfxVoices.get(padId);
    if (voice?.mode === 'hold') this.stopSfxVoice(padId, 0.05);
  }

  private stopSfxVoice(padId: string, fadeSec: number): void {
    const voice = this.sfxVoices.get(padId);
    if (!voice || !this.ctx) return;
    const ctx = this.ctx;
    rampParam(voice.envelope.gain, 0, ctx, fadeSec * 1000);
    try {
      voice.source.stop(ctx.currentTime + fadeSec + 0.02);
    } catch {
      /* already stopped */
    }
    this.sfxVoices.delete(padId);
    usePlaybackStore.getState().setSfxActive(padId, false);
  }

  // ---- Ambient Pads (section 4) ------------------------------------------

  async playAmbientKey(key: string): Promise<void> {
    await this.ensureStarted();
    const ctx = this.ctx!;
    const activeKey = usePlaybackStore.getState().activeAmbientKey;

    if (activeKey === key && this.currentAmbientVoice) {
      this.currentAmbientVoice.release();
      this.currentAmbientVoice = null;
      usePlaybackStore.getState().setAmbientKey(null);
      return;
    }

    const quality = useUIStore.getState().ambientQuality;
    const previous = this.currentAmbientVoice;
    const voice = new AmbientVoice(
      ctx,
      key,
      quality,
      this.ambientPack,
      this.buses.ambient.input,
      this.reverbConvolver,
    );

    if (previous) {
      previous.release(AMBIENT_CROSSFADE_SEC);
      voice.attack(AMBIENT_CROSSFADE_SEC);
    } else {
      voice.attack();
    }

    this.currentAmbientVoice = voice;
    usePlaybackStore.getState().setAmbientKey(key);
  }

  fadeOutAmbient(): void {
    if (!this.currentAmbientVoice) return;
    this.currentAmbientVoice.release(AMBIENT_FADE_OUT_SEC);
    this.currentAmbientVoice = null;
    usePlaybackStore.getState().setAmbientKey(null);
  }

  setAmbientPack(pack: AmbientPack): void {
    this.ambientPack = pack;
  }

  // ---- Global transport ---------------------------------------------------

  async stopAll(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const masterTarget = faderValueToGain(useUIStore.getState().levels.master);
    rampParam(this.masterGain.gain, 0, ctx, STOP_ALL_MS);
    await delay(STOP_ALL_MS + 10);
    this.stopAllVoices();
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(masterTarget, ctx.currentTime);
  }

  async fadeAll(durationSec = FADE_ALL_SEC): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const masterTarget = faderValueToGain(useUIStore.getState().levels.master);
    rampParam(this.masterGain.gain, 0, ctx, durationSec * 1000);
    await delay(durationSec * 1000 + 20);
    this.stopAllVoices();
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(masterTarget, ctx.currentTime);
  }

  private stopAllVoices(): void {
    for (const padId of [...this.sfxVoices.keys()]) this.stopSfxVoice(padId, 0.01);
    if (this.currentAmbientVoice) {
      this.currentAmbientVoice.dispose();
      this.currentAmbientVoice = null;
      usePlaybackStore.getState().setAmbientKey(null);
    }
  }
}

export const audioEngine = new AudioEngine();
