import { useEffect, useState, type ReactNode } from 'react';
import './Stage.css';

// Song Clips / Sound Effects / Background each grew a 3rd pad column
// (+106px: 98px pad + 8px gap) per the 10->15 pads-per-bank feature, and
// Ambient Pads' keys grew from 64px to 98px (matching Pad size) to match
// everything else, which widened that panel from ~290px to a fixed 386px
// (same width as the other three, by the same grid math) - +96px more.
const STAGE_W = 1180 + 3 * 106 + 96;
const STAGE_H = 820;

function useStageScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / STAGE_W, vh / STAGE_H));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return scale;
}

function usePortrait() {
  const [portrait, setPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const update = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return portrait;
}

export function Stage({ children }: { children: ReactNode }) {
  const scale = useStageScale();
  const portrait = usePortrait();

  return (
    <div className="stage-viewport">
      <div
        className="stage"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
      {portrait && (
        <div className="rotate-overlay">
          <p>Rotate your iPad</p>
        </div>
      )}
    </div>
  );
}
