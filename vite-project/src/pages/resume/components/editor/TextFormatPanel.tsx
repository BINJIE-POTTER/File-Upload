import { useEffect } from "react";
import { Bold, Italic } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXT_FORMAT_PRESET_COLORS } from "../constants";

type TextFormatPanelProps = {
  onFormat: (cmd: "bold" | "italic" | "color", value?: string) => void;
  onClose?: () => void;
  primaryColor?: string;
};

/**
 * TextFormatPanel - 文本格式工具栏
 *
 * 在选中文本时显示，提供加粗、斜体、颜色功能
 *
 * @param onFormat - 格式化命令回调（bold/italic/color）
 * @param onClose - 关闭面板回调
 * @param primaryColor - 主题色（会添加到预设颜色列表开头）
 */
export function TextFormatPanel({
  onFormat,
  onClose,
  primaryColor,
}: TextFormatPanelProps) {
  // ── ESC 键关闭 ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── 处理颜色预设列表（将主题色添加到列表开头） ──────────────────────────
  const presets = TEXT_FORMAT_PRESET_COLORS as readonly string[];
  const colors =
    primaryColor && !presets.includes(primaryColor)
      ? [primaryColor, ...presets]
      : presets;

  return (
    <div
      data-text-format-panel
      className="flex items-center gap-1 p-1 rounded-md border bg-popover shadow-lg"
      role="toolbar"
      aria-label="Format text"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* 加粗按钮 */}
      <button
        type="button"
        onClick={() => onFormat("bold")}
        className="p-1.5 rounded hover:bg-accent"
        aria-label="Bold"
      >
        <Bold className="size-4" />
      </button>
      {/* 斜体按钮 */}
      <button
        type="button"
        onClick={() => onFormat("italic")}
        className="p-1.5 rounded hover:bg-accent"
        aria-label="Italic"
      >
        <Italic className="size-4" />
      </button>
      <div className="w-px h-5 bg-border" aria-hidden />
      {/* 颜色选择按钮列表 */}
      <div className="flex gap-0.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onFormat("color", c)}
            className={cn(
              "size-5 rounded border shrink-0 transition-transform hover:scale-110",
              c === "#000000" && "border-border"
            )}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
