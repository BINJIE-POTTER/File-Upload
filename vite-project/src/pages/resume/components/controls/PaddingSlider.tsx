import { Slider } from "@/components/ui/slider";

interface PaddingSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  min?: number;
  max?: number;
}

/**
 * PaddingSlider - 内边距滑块组件
 *
 * @param label - 标签文本
 * @param value - 当前值（毫米）
 * @param onChange - 值变化回调
 * @param color - 主题色（用于滑块样式）
 * @param min - 最小值（默认 8）
 * @param max - 最大值（默认 25）
 */
export function PaddingSlider({ label, value, onChange, color, min = 8, max = 25 }: PaddingSliderProps) {
  return (
    <div>
      {/* 标签 + 数值显示 */}
      <label className="text-xs text-gray-500 block mb-2">
        {label} <span className="font-mono text-gray-400">{value}mm</span>
      </label>

      {/* 滑块 */}
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