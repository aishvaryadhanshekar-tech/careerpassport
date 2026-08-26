export function SegmentedControl<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  ariaLabel: string;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === value ? "segmented-btn on" : "segmented-btn"}
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
