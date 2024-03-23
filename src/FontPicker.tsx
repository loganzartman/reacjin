export const allFonts = {
  'sans-serif': {style: {fontFamily: 'sans-serif'}},
  serif: {style: {fontFamily: 'serif'}},
  monospace: {style: {fontFamily: 'monospace'}},
  cursive: {style: {fontFamily: 'cursive'}},
} as const;

export function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="select select-sm font-bold"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
    >
      {Object.entries(allFonts).map(([name, font]) => (
        <option
          key={name}
          value={name}
          className="text-xl font-bold"
          style={font.style}
        >
          {name}
        </option>
      ))}
    </select>
  );
}
