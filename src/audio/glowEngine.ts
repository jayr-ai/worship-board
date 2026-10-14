// Section 5: drives every pad's glow intensity from a single rAF loop,
// writing the --glow custom property straight onto each pad's DOM node via
// a ref. Never touches React state, so pulsing/fading never causes a
// re-render (the explicit performance rule in the spec).
import { useUIStore } from '../store/useUIStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import type { TriggerMode } from '../types';
import { audioEngine } from './AudioEngine';
import { FLASH_TOTAL_MS, flashFactor, pulseFactor } from './glowMath';

export type GlowSection = 'clips' | 'sfx' | 'bg' | 'ambient';

interface RegistryEntry {
  el: HTMLElement;
  section: GlowSection;
  mode?: TriggerMode;
}

class GlowEngine {
  private registry = new Map<string, RegistryEntry>();
  private flashes = new Map<string, number>(); // glowId -> start time (performance.now())
  private running = false;

  register(glowId: string, el: HTMLElement, section: GlowSection, mode?: TriggerMode): () => void {
    this.registry.set(glowId, { el, section, mode });
    this.ensureLoop();
    return () => {
      if (this.registry.get(glowId)?.el === el) this.registry.delete(glowId);
    };
  }

  /** Called by the audio engine the instant a one-shot SFX is triggered. */
  flash(glowId: string): void {
    this.flashes.set(glowId, performance.now());
    this.ensureLoop();
  }

  private ensureLoop(): void {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    const now = performance.now();
    const pulseEnabled = useUIStore.getState().pulseAnimation;
    const playback = usePlaybackStore.getState();
    const pulse = pulseFactor(now);

    for (const [glowId, entry] of this.registry) {
      let value = 0;

      if (entry.section === 'sfx') {
        const flashStart = this.flashes.get(glowId);
        const mode = entry.mode ?? 'oneshot';
        if (mode === 'oneshot') {
          if (flashStart != null) {
            const elapsed = now - flashStart;
            if (elapsed >= FLASH_TOTAL_MS) {
              this.flashes.delete(glowId);
            } else {
              value = flashFactor(elapsed);
            }
          }
        } else if (playback.activeSfxPadIds.has(glowId)) {
          const level = audioEngine.getSfxLevel(glowId);
          value = pulseEnabled ? level * pulse : level;
        }
      } else if (entry.section === 'clips') {
        if (playback.activeClipPadIds.has(glowId)) {
          const level = audioEngine.getClipLevel(glowId);
          value = pulseEnabled ? level * pulse : level;
        }
      } else if (entry.section === 'bg') {
        const level = audioEngine.getBackgroundLevel(glowId);
        value = pulseEnabled ? level * pulse : level;
      } else if (entry.section === 'ambient') {
        const level = audioEngine.getAmbientKeyLevel(glowId);
        value = pulseEnabled ? level * pulse : level;
      }

      entry.el.style.setProperty('--glow', value.toFixed(3));
      // Lift a glowing pad above its neighbors so the halo isn't painted
      // underneath whatever comes after it in the grid (5.1: "z-index: 2
      // so the glow sits above neighboring pads").
      entry.el.style.zIndex = value > 0.02 ? '2' : '';
    }

    requestAnimationFrame(this.tick);
  };
}

export const glowEngine = new GlowEngine();
