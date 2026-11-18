import type { PadAssignment, SectionId, TriggerMode } from '../types';
import { useUIStore } from '../store/useUIStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { faderValueToGain, dbToGain } from './taper';
import { rampParam } from './ramp';
import { getSfxAudioBuffer } from './sfxBuffers';
import { WakeLockManager } from './wakeLock';
import { createSilentAudioElement } from './silentAudio';
import { BackgroundEngine } from './BackgroundEngine';
import { shuffleIds } from './shuffle';
import { useLibraryStore } from '../store/useLibraryStore';
import { useSetStore } from '../store/useSetStore';
import { decodeLibraryItem, getTrimmedClipBuffer } from './clipBuffers';
import { computePeaks } from './peaks';
import { computeFadeSchedule } from './envelope';
import { glowEngine } from './glowEngine';
import { useToastStore } from '../store/useToastStore';

const FADE_ALL_SEC = 3;
const STOP_ALL_MS = 80;
const EXCLUSIVE_CLIP_FADE_SEC = 0.8;
const RAMP_MS = 8;
const AUTO_DUCK_AMOUNT_DB = -6;
const AUTO_DUCK_ATTACK_SEC = 0.04;
const AUTO_DUCK_RELEASE_SEC = 0.7;
const AUTO_DUCK_MAX_HOLD_SEC = 3;

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
  peakGain: number;
}

interface ActiveClipVoice {
  source: AudioBufferSourceNode;
  envelope: GainNode;
  peakGain: number;
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private limiter!: DynamicsCompressorNode;
  private buses!: Record<SectionId, Bus>;
  private sfxVoices = new Map<string, ActiveSfxVoice>();
  private clipVoices = new Map<string, ActiveClipVoice>();
  private auditionVoice: { source: AudioBufferSourceNode; envelope: GainNode } | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private wakeLock = new WakeLockManager();
  private globalUnlockBound = false;
  private background: BackgroundEngine | null = null;
  private bgObjectUrls = new Map<string, string>();
  /** Ambient Pads is now a second, independently-navigable song player
   * (same engine class as Background), scoped to whichever Library folder
   * the user picks - see getAmbientPlaylist. */
  private ambientPlayer: BackgroundEngine | null = null;
  private ambientObjectUrls = new Map<string, string>();
  private ambientShuffleOrder: string[] | null = null;
  private duckReleaseTimer: number | null = null;

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
      useSetStore.subscribe(() => {
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
    this.masterGain.gain.value = faderValueToGain(useSetStore.getState().current.levels.master);

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
      ambient: this.createBus(ctx, true),
    };

    this.background = new BackgroundEngine(
      ctx,
      this.buses.bg.input,
      (padId, playing) => usePlaybackStore.getState().setBackground(padId, playing),
      (looping) => usePlaybackStore.getState().setBgLooping(looping),
    );
    this.ambientPlayer = new BackgroundEngine(
      ctx,
      this.buses.ambient.input,
      (padId, playing) => usePlaybackStore.getState().setAmbientSong(padId, playing),
      (looping) => usePlaybackStore.getState().setAmbientSongLooping(looping),
      (endedId) => void this.nextAmbientSong(endedId),
    );
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
    const { levels, muted } = useSetStore.getState().current;
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

  // ---- Glow (section 5): per-voice level, normalized 0..1 against each
  // voice's own peak so a trimmed-down pad still reads "full" at its own
  // volume. ---------------------------------------------------------------

  getClipLevel(padId: string): number {
    const voice = this.clipVoices.get(padId);
    if (!voice) return 0;
    return Math.min(1, voice.envelope.gain.value / voice.peakGain);
  }

  getSfxLevel(padId: string): number {
    const voice = this.sfxVoices.get(padId);
    if (!voice) return 0;
    return Math.min(1, voice.envelope.gain.value / voice.peakGain);
  }

  getBackgroundLevel(padId: string): number {
    return this.background?.getPadLevel(padId) ?? 0;
  }

  // ---- Auto-Duck (6.6): SFX temporarily lowers Background (and optionally
  // Ambient). Overlapping SFX extend the hold instead of stacking, since
  // every duck ramps to the same fixed target rather than compounding. ----

  private applyDuck(holdSec: number): void {
    const ctx = this.ctx;
    if (!ctx || !useUIStore.getState().autoDuckEnabled) return;

    const targets = [this.buses.bg.duck!];
    if (useUIStore.getState().duckAmbientToo) targets.push(this.buses.ambient.duck!);

    const now = ctx.currentTime;
    const duckGain = dbToGain(AUTO_DUCK_AMOUNT_DB);
    for (const node of targets) {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.linearRampToValueAtTime(duckGain, now + AUTO_DUCK_ATTACK_SEC);
    }

    if (this.duckReleaseTimer != null) window.clearTimeout(this.duckReleaseTimer);
    this.duckReleaseTimer = window.setTimeout(() => this.releaseDuck(), holdSec * 1000);
  }

  private releaseDuck(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const node of [this.buses.bg.duck!, this.buses.ambient.duck!]) {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.linearRampToValueAtTime(1, now + AUTO_DUCK_RELEASE_SEC);
    }
    this.duckReleaseTimer = null;
  }

  // ---- Song Clips (section 1) --------------------------------------------

  /** Waveform for the clip editor: cached on the library item after the
   * first computation (section 7: "peaks computed once at import and
   * cached"). Also returns the song's full duration for the editor. */
  async getWaveform(libraryId: string): Promise<{ peaks: Float32Array; durationSec: number } | null> {
    const item = useLibraryStore.getState().items.find((i) => i.id === libraryId);
    if (!item) return null;

    if (item.peaks && item.peaks.length > 0) {
      return { peaks: new Float32Array(item.peaks), durationSec: item.durationSec };
    }

    await this.ensureStarted();
    const buffer = await decodeLibraryItem(this.ctx!, libraryId);
    if (!buffer) return null;

    const peaks = computePeaks(buffer);
    void useLibraryStore.getState().savePeaks(libraryId, peaks);
    return { peaks, durationSec: buffer.duration };
  }

  async triggerClipDown(pad: PadAssignment): Promise<void> {
    if (!pad.libraryId || pad.startSec == null || pad.endSec == null) return;
    await this.ensureStarted();
    const ctx = this.ctx!;

    if (this.clipVoices.has(pad.id)) {
      // Tapping the already-playing pad fades it out over its own length.
      this.stopClipVoice(pad.id, pad.fadeOutSec ?? 3);
      return;
    }

    if (useSetStore.getState().current.exclusiveClips) {
      for (const otherId of [...this.clipVoices.keys()]) {
        this.stopClipVoice(otherId, EXCLUSIVE_CLIP_FADE_SEC);
      }
    }

    const buffer = await getTrimmedClipBuffer(ctx, pad.libraryId, pad.startSec, pad.endSec);
    if (!buffer) {
      useToastStore.getState().push(`Couldn't play "${pad.label ?? 'this clip'}" — the source file may be missing or corrupted.`);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const envelope = ctx.createGain();
    const peakGain = dbToGain(pad.trimDb ?? 0);
    const { fadeStartSec } = computeFadeSchedule(buffer.duration, pad.fadeOutSec ?? 3);
    const now = ctx.currentTime;
    envelope.gain.setValueAtTime(peakGain, now);
    envelope.gain.setValueAtTime(peakGain, now + fadeStartSec);
    envelope.gain.linearRampToValueAtTime(0, now + buffer.duration);

    source.connect(envelope).connect(this.buses.clips.input);
    source.start();

    this.clipVoices.set(pad.id, { source, envelope, peakGain });
    usePlaybackStore.getState().setClipActive(pad.id, true);

    source.onended = () => {
      // Guard against a race where a retrigger already replaced this entry.
      if (this.clipVoices.get(pad.id)?.source === source) {
        this.clipVoices.delete(pad.id);
        usePlaybackStore.getState().setClipActive(pad.id, false);
      }
    };
  }

  /** Schedules the fade-out ramp; the voice cleans itself up (map + active
   * state) via its own 'ended' event once the ramp finishes, so its level
   * stays readable by the glow loop throughout the fade (5.3). */
  private stopClipVoice(padId: string, fadeSec: number): void {
    const voice = this.clipVoices.get(padId);
    if (!voice || !this.ctx) return;
    const ctx = this.ctx;
    rampParam(voice.envelope.gain, 0, ctx, fadeSec * 1000);
    try {
      voice.source.stop(ctx.currentTime + fadeSec + 0.02);
    } catch {
      /* already stopped */
    }
  }

  /** Clip editor preview: plays [startSec, endSec) with the given fade-out,
   * independent of any pad's own playback state. */
  async auditionClip(
    libraryId: string,
    startSec: number,
    endSec: number,
    fadeOutSec: number,
  ): Promise<void> {
    await this.ensureStarted();
    const ctx = this.ctx!;
    this.stopAudition();

    const buffer = await getTrimmedClipBuffer(ctx, libraryId, startSec, endSec);
    if (!buffer) {
      useToastStore.getState().push("Couldn't decode that audio for preview.");
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const envelope = ctx.createGain();
    const { fadeStartSec } = computeFadeSchedule(buffer.duration, fadeOutSec);
    const now = ctx.currentTime;
    envelope.gain.setValueAtTime(1, now);
    envelope.gain.setValueAtTime(1, now + fadeStartSec);
    envelope.gain.linearRampToValueAtTime(0, now + buffer.duration);

    source.connect(envelope).connect(this.buses.clips.input);
    source.start();
    this.auditionVoice = { source, envelope };
    source.onended = () => {
      if (this.auditionVoice?.source === source) this.auditionVoice = null;
    };
  }

  stopAudition(): void {
    if (!this.auditionVoice || !this.ctx) return;
    const { source, envelope } = this.auditionVoice;
    rampParam(envelope.gain, 0, this.ctx, 30);
    try {
      source.stop(this.ctx.currentTime + 0.05);
    } catch {
      /* already stopped */
    }
    this.auditionVoice = null;
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

    const buffer = await getSfxAudioBuffer(ctx, pad.libraryId);
    if (!buffer) {
      useToastStore.getState().push(`Couldn't play "${pad.label ?? 'this sound'}" — try re-importing the file.`);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = mode !== 'oneshot';

    const envelope = ctx.createGain();
    const peakGain = dbToGain(pad.trimDb ?? 0);
    envelope.gain.value = peakGain;
    source.connect(envelope).connect(this.buses.sfx.input);
    source.start();

    this.sfxVoices.set(pad.id, { source, envelope, mode, peakGain });
    usePlaybackStore.getState().setSfxActive(pad.id, true);
    this.applyDuck(mode === 'oneshot' ? Math.min(buffer.duration, AUTO_DUCK_MAX_HOLD_SEC) : AUTO_DUCK_MAX_HOLD_SEC);

    if (mode === 'oneshot') {
      // Flash is independent of the real envelope (5.4): a fixed 60ms rise
      // + 450ms decay regardless of the sample's actual length.
      glowEngine.flash(pad.id);
    }

    source.onended = () => {
      if (this.sfxVoices.get(pad.id)?.source === source) {
        this.sfxVoices.delete(pad.id);
        usePlaybackStore.getState().setSfxActive(pad.id, false);
      }
    };
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
  }

  // ---- Ambient Pads (section 4): a song player like Background, but
  // scoped to whichever Library folder the user has picked for it (see
  // useSetStore's ambientSongFolderId) instead of the whole Library. -------

  private blobUrlForAmbientSong(libraryId: string): string | null {
    const cached = this.ambientObjectUrls.get(libraryId);
    if (cached) return cached;
    const item = useLibraryStore.getState().items.find((i) => i.id === libraryId);
    if (!item) return null;
    const url = URL.createObjectURL(item.blob);
    this.ambientObjectUrls.set(libraryId, url);
    return url;
  }

  /** Alphabetical order of whatever's filed in the chosen folder, or a
   * shuffled order re-rolled each time shuffle is turned on. Empty until a
   * folder is actually picked (see AmbientPlayer's empty state). */
  private getAmbientPlaylist(): { id: string; label: string }[] {
    const folderId = useSetStore.getState().current.ambientSongFolderId;
    if (!folderId) return [];
    const items = useLibraryStore.getState().items.filter((i) => i.folderId === folderId);
    const sorted = [...items].sort((a, b) => a.label.localeCompare(b.label));
    if (!usePlaybackStore.getState().ambientSongShuffle) return sorted;
    if (!this.ambientShuffleOrder) this.ambientShuffleOrder = shuffleIds(sorted.map((i) => i.id));
    const byId = new Map(sorted.map((i) => [i.id, i]));
    return this.ambientShuffleOrder.map((id) => byId.get(id)).filter((i): i is (typeof sorted)[number] => !!i);
  }

  async playAmbientSong(libraryId: string, forceRestart = false): Promise<void> {
    await this.ensureStarted();
    const item = useLibraryStore.getState().items.find((i) => i.id === libraryId);
    const url = this.blobUrlForAmbientSong(libraryId);
    if (!url) {
      useToastStore.getState().push(`Couldn't find "${item?.label ?? 'that song'}" in the library.`);
      return;
    }
    const looping = usePlaybackStore.getState().ambientSongLooping;
    const pad: PadAssignment = { id: libraryId, libraryId, tag: looping ? 'LOOP' : 'ONCE' };
    try {
      await this.ambientPlayer!.playPad(pad, url, 1, 4, forceRestart);
    } catch {
      useToastStore.getState().push(`Couldn't play "${item?.label ?? 'that song'}" — the file may be unsupported.`);
    }
  }

  toggleAmbientSongPlayPause(): void {
    this.ambientPlayer?.togglePlayPause();
  }

  toggleAmbientSongLoop(): void {
    this.ambientPlayer?.toggleLoop();
  }

  toggleAmbientSongShuffle(): void {
    const next = !usePlaybackStore.getState().ambientSongShuffle;
    usePlaybackStore.getState().setAmbientSongShuffle(next);
    this.ambientShuffleOrder = next
      ? shuffleIds(this.getAmbientPlaylist().map((i) => i.id))
      : null;
  }

  /** Plays the song after `afterId` (defaults to whatever's currently
   * playing) in the current playlist order. Used by the Next button and by
   * the ambient BackgroundEngine's onEnded hook for auto-advance. */
  async nextAmbientSong(afterId?: string): Promise<void> {
    const playlist = this.getAmbientPlaylist();
    if (playlist.length === 0) return;
    const currentId = afterId ?? this.ambientPlayer?.playingPadId ?? null;
    const currentIndex = playlist.findIndex((i) => i.id === currentId);
    const next = playlist[(currentIndex + 1) % playlist.length];
    await this.playAmbientSong(next.id, true);
  }

  async previousAmbientSong(): Promise<void> {
    const playlist = this.getAmbientPlaylist();
    if (playlist.length === 0) return;
    const currentId = this.ambientPlayer?.playingPadId ?? null;
    const currentIndex = playlist.findIndex((i) => i.id === currentId);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + playlist.length) % playlist.length;
    await this.playAmbientSong(playlist[prevIndex].id, true);
  }

  // ---- Background (section 3) --------------------------------------------

  private blobUrlForPad(pad: PadAssignment): string | null {
    if (!pad.libraryId) return null;
    const cached = this.bgObjectUrls.get(pad.libraryId);
    if (cached) return cached;
    const item = useLibraryStore.getState().items.find((i) => i.id === pad.libraryId);
    if (!item) return null;
    const url = URL.createObjectURL(item.blob);
    this.bgObjectUrls.set(pad.libraryId, url);
    return url;
  }

  async triggerBackgroundPad(pad: PadAssignment, crossfadeSec?: number): Promise<void> {
    if (!pad.libraryId) return;
    await this.ensureStarted();
    const url = this.blobUrlForPad(pad);
    if (!url) {
      useToastStore.getState().push(`Couldn't find "${pad.label ?? 'that song'}" in the library.`);
      return;
    }
    try {
      await this.background!.playPad(pad, url, dbToGain(pad.trimDb ?? 0), crossfadeSec);
    } catch {
      useToastStore.getState().push(`Couldn't play "${pad.label ?? 'that song'}" — the file may be unsupported.`);
    }
  }

  toggleBackgroundPlayPause(): void {
    this.background?.togglePlayPause();
  }

  toggleBackgroundLoop(): void {
    this.background?.toggleLoop();
    const padId = this.background?.playingPadId;
    if (padId) {
      const looping = usePlaybackStore.getState().bgLooping;
      void useSetStore.getState().updatePad(padId, { tag: looping ? 'LOOP' : 'ONCE' });
    }
  }

  async nextBackgroundPad(pads: PadAssignment[]): Promise<void> {
    const assigned = pads.filter((p) => p.libraryId);
    if (assigned.length === 0) return;
    const currentId = this.background?.playingPadId ?? null;
    const currentIndex = assigned.findIndex((p) => p.id === currentId);
    const next = assigned[(currentIndex + 1) % assigned.length];
    await this.triggerBackgroundPad(next);
  }

  // ---- Global transport ---------------------------------------------------

  async stopAll(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const masterTarget = faderValueToGain(useSetStore.getState().current.levels.master);
    rampParam(this.masterGain.gain, 0, ctx, STOP_ALL_MS);
    await delay(STOP_ALL_MS + 10);
    this.stopAllVoices();
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(masterTarget, ctx.currentTime);
  }

  async fadeAll(durationSec = FADE_ALL_SEC): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const masterTarget = faderValueToGain(useSetStore.getState().current.levels.master);
    rampParam(this.masterGain.gain, 0, ctx, durationSec * 1000);
    await delay(durationSec * 1000 + 20);
    this.stopAllVoices();
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(masterTarget, ctx.currentTime);
  }

  private stopAllVoices(): void {
    for (const padId of [...this.sfxVoices.keys()]) this.stopSfxVoice(padId, 0.01);
    for (const padId of [...this.clipVoices.keys()]) this.stopClipVoice(padId, 0.01);
    this.stopAudition();
    this.background?.hardStop();
    this.ambientPlayer?.hardStop();
  }
}

export const audioEngine = new AudioEngine();
