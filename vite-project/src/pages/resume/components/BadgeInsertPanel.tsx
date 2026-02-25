import React, { useState, useRef, useEffect } from "react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BADGE_VARIANTS = ["default", "secondary", "outline"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

const getBadgePreviewStyle = (
  variant: BadgeVariant,
  color?: string,
  lightColor?: string
): React.CSSProperties | undefined => {
  if (!color) return undefined;
  switch (variant) {
    case "default":
      return { backgroundColor: color, color: "white" };
    case "secondary":
      return lightColor ? { backgroundColor: lightColor, color } : undefined;
    case "outline":
      return { borderColor: color, color };
    default:
      return undefined;
  }
};

type BadgeInsertPanelProps = {
  onConfirm: (variant: BadgeVariant, text: string) => void;
  onClose?: () => void;
  color?: string;
  lightColor?: string;
  initialVariant?: BadgeVariant;
  initialText?: string;
  isEdit?: boolean;
};

/** Panel for insert/edit badge: pick variant, preview text, confirm. */
export function BadgeInsertPanel({
  onConfirm,
  onClose,
  color,
  lightColor,
  initialVariant = "default",
  initialText = "",
  isEdit = false,
}: BadgeInsertPanelProps) {
  const [variant, setVariant] = useState<BadgeVariant>(initialVariant);
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingConfirmRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const valueToUse = inputRef.current?.value ?? text;
    pendingConfirmRef.current = false;
    onConfirm(variant, valueToUse || "Badge");
    onClose?.();
  };

  const handleCompositionEnd = () => {
    if (pendingConfirmRef.current) handleConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing) {
        pendingConfirmRef.current = true;
      } else {
        handleConfirm();
      }
    }
    if (e.key === "Escape") onClose?.();
  };

  return (
    <div
      className="flex flex-col gap-3 p-2 w-64"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Insert badge"
    >
      <div className="flex flex-wrap gap-1">
        {BADGE_VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded capitalize transition-colors",
              variant === v ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50"
            )}
            aria-pressed={variant === v}
            aria-label={`Variant ${v}`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Badge text…"
          className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-ring/50"
          aria-label="Badge text"
        />
        <div className="text-xs text-muted-foreground">Preview:</div>
        <div className="min-h-6 flex items-center">
          <Badge variant={variant} style={getBadgePreviewStyle(variant, color, lightColor)}>
            {text || "Badge"}
          </Badge>
        </div>
      </div>
      <Button size="sm" onClick={handleConfirm} className="w-full">
        {isEdit ? "Update" : "Insert"}
      </Button>
    </div>
  );
}

/** Returns HTML string for a badge to insert into contenteditable. Inline, vertical-align middle. */
export function createBadgeHtml(variant: BadgeVariant, text: string): string {
  const cls = badgeVariants({ variant }) + " leading-none";
  const style = "vertical-align:middle line-height:1";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<span contenteditable="false" data-badge data-variant="${variant}" class="${cls}" style="${style}">${escaped}</span>`;
}
