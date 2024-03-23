export function ComboRange({
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  // a text input and range input that edit the same value
  return (
    <div className="flex flex-row items-center gap-2">
      <input
        className="flex-1 range range-primary"
        type="range"
        value={value}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
        min={min}
        max={max}
        step={step}
      />
      <input
        className="input-sm"
        type="number"
        value={value}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
