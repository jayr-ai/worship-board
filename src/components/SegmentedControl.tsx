import './SegmentedControl.css';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={`segmented ${disabled ? 'segmented--disabled' : ''}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented__option ${value === opt.value ? 'segmented__option--active' : ''}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
