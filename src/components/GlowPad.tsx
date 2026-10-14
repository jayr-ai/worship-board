import { useEffect, useRef } from 'react';
import { Pad } from './Pad';
import type { PadAccent } from './Pad';
import { glowEngine, type GlowSection } from '../audio/glowEngine';
import type { TriggerMode } from '../types';

interface GlowPadProps {
  glowId: string;
  glowSection: GlowSection;
  glowMode?: TriggerMode;
  size: number;
  accent: PadAccent;
  label?: string;
  tag?: string;
  duration?: string;
  active?: boolean;
  showProgress?: boolean;
  editing?: boolean;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
}

/** Wraps Pad with glow-engine registration: a ref to the real DOM node so
 * the rAF loop in glowEngine.ts can write --glow directly, bypassing React
 * state entirely (section 5.2's explicit performance rule). */
export function GlowPad({ glowId, glowSection, glowMode, ...padProps }: GlowPadProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return glowEngine.register(glowId, ref.current, glowSection, glowMode);
  }, [glowId, glowSection, glowMode]);

  return <Pad ref={ref} {...padProps} />;
}
