import { cn } from "@/lib/utils";

/**
 * 字体选项配置
 */
export interface FontOption {
  id: string;
  label: string;
  fontFamily: string;
}

interface FontSelectorProps {
  value: string;
  onChange: (id: string) => void;
  fonts: FontOption[];
}

/**
 * FontSelector - 字体选择器组件
 *
 * 显示多个字体选项按钮，当前选中项高亮
 *
 * @param value - 当前选中的字体 ID
 * @param onChange - 字体变化回调
 * @param fonts - 字体选项列表
 */
export function FontSelector({ value, onChange, fonts }: FontSelectorProps) {
  return (
    <div>
      {/* 标签 */}
      <label className="text-xs text-gray-500 block mb-2">Font</label>

      {/* 字体选项按钮组 */}
      <div className="flex gap-1">
        {fonts.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex-1 px-2 py-1.5 rounded text-xs transition-colors",
              value === f.id ? "bg-gray-100 font-medium text-gray-800" : "text-gray-500 hover:bg-gray-50"
            )}
            style={value === f.id ? { fontFamily: f.fontFamily } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}