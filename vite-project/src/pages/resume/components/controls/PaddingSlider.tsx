import { Slider } from "@/components/ui/slider";

interface PaddingSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  min?: number;
  max?: number;
}

export function PaddingSlider({ label, value, onChange, color, min = 8, max = 25 }: PaddingSliderProps) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-2">
        {label} <span className="font-mono text-gray-400">{value}mm</span>
      </label>
      <div style={{ "--primary": color, "--ring": color } as React.CSSProperties}>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="[&_[data-slot=slider-range]]:bg-[var(--primary)] [&_[data-slot=slider-thumb]]:border-[var(--primary)]"
        />
      </div>
    </div>
  );
}