import { useEffect, useState, type ReactNode } from 'react';
import './Stage.css';

const STAGE_W = 1180;
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
