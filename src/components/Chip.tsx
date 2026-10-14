import './Chip.css';

interface ChipProps {
  label: string;
  value: string;
  outlined?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function Chip({ label, value, outlined = false, disabled = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip ${outlined ? 'chip--outlined' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="chip__label">{label}</span>
      <span className="chip__value">{value}</span>
    </button>
  );
}
