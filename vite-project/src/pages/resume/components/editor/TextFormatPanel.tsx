import { useEffect } from "react";
import { Bold, Italic } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXT_FORMAT_PRESET_COLORS } from "../constants";

type TextFormatPanelProps = {
  onFormat: (cmd: "bold" | "italic" | "color", value?: string) => void;
  onClose?: () => void;
  primaryColor?: string;
};

export function TextFormatPanel({
  onFormat,
  onClose,
  primaryColor,
}: TextFormatPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      <button
        type="button"
        onClick={() => onFormat("bold")}
        className="p-1.5 rounded hover:bg-accent"
        aria-label="Bold"
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onFormat("italic")}
        className="p-1.5 rounded hover:bg-accent"
        aria-label="Italic"
      >
        <Italic className="size-4" />
      </button>
      <div className="w-px h-5 bg-border" aria-hidden />
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
