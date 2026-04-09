import { COLOR_PRESETS } from "../constants";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-2 block">Primary Color</label>
      <div className="flex flex-wrap gap-2 mb-2.5">
        {COLOR_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0"
            style={{
              background: p,
              outline: color === p ? `2.5px solid ${p}` : "2.5px solid transparent",
              outlineOffset: "2px",
            }}
            aria-label={`Color ${p}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label
          className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer shrink-0"
          style={{ background: color, outline: "2px solid #e5e7eb" }}
          title="Custom color"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
        <span className="text-xs font-mono text-gray-400">{color}</span>
      </div>
    </div>
  );
}