import { useEffect, useRef } from 'react';
import { glowEngine } from '../audio/glowEngine';

interface AmbientKeyProps {
  note: string;
  editing?: boolean;
  hasCustomAudio?: boolean;
  onPointerDown: () => void;
  onEdit?: () => void;
}

export function AmbientKey({
  note,
  editing = false,
  hasCustomAudio = false,
  onPointerDown,
  onEdit,
}: AmbientKeyProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return glowEngine.register(note, ref.current, 'ambient');
  }, [note]);

  return (
    <button
      ref={ref}
      type="button"
      className="ambient__key"
      onPointerDown={editing ? onEdit : onPointerDown}
    >
      {editing && <span className="ambient__key-edit-badge">✎</span>}
      {!editing && hasCustomAudio && <span className="ambient__key-custom-dot" />}
      {note}
    </button>
  );
}
