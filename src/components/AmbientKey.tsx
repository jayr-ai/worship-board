import { useEffect, useRef } from 'react';
import { glowEngine } from '../audio/glowEngine';

interface AmbientKeyProps {
  note: string;
  onPointerDown: () => void;
}

export function AmbientKey({ note, onPointerDown }: AmbientKeyProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return glowEngine.register(note, ref.current, 'ambient');
  }, [note]);

  return (
    <button ref={ref} type="button" className="ambient__key" onPointerDown={onPointerDown}>
      {note}
    </button>
  );
}
