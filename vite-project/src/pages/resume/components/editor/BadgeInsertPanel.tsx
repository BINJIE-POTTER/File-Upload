import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BADGE_VARIANTS, type BadgeVariant } from "../constants";

/**
 * 预览徽章样式计算
 * 根据变体和颜色返回对应的 CSS 样式
 */
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

/**
 * BadgeInsertPanel - 徽章插入/编辑面板
 *
 * 功能：
 * - 选择徽章样式（default/secondary/outline）
 * - 输入徽章文本
 * - 实时预览徽章效果
 * - 支持插入和编辑两种模式
 *
 * @param onConfirm - 确认回调（variant, text）
 * @param onClose - 关闭回调
 * @param color - 主题色（用于预览样式）
 * @param lightColor - 浅色主题色（用于 secondary 变体）
 * @param initialVariant - 初始变体（编辑时传入当前值）
 * @param initialText - 初始文本（编辑时传入当前值）
 * @param isEdit - 是否为编辑模式
 */
export function BadgeInsertPanel({
  onConfirm,
  onClose,
  color,
  lightColor,
  initialVariant = "default",
  initialText = "",
  isEdit = false,
}: BadgeInsertPanelProps) {
  // ── 状态 ─────────────────────────────────────────────────────────────────
  const [variant, setVariant] = useState<BadgeVariant>(initialVariant);
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingConfirmRef = useRef(false);

  // ── 自动聚焦 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── 确认插入 ─────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const valueToUse = inputRef.current?.value ?? text;
    pendingConfirmRef.current = false;
    onConfirm(variant, valueToUse || "Badge");
    onClose?.();
  };

  // ── 输入法组合结束处理 ───────────────────────────────────────────────────
  const handleCompositionEnd = () => {
    if (pendingConfirmRef.current) handleConfirm();
  };

  // ── 键盘事件处理 ─────────────────────────────────────────────────────────
  // Enter 确认，Escape 关闭
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
      {/* 变体选择 */}
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

      {/* 文本输入和预览 */}
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

      {/* 确认按钮 */}
      <Button size="sm" onClick={handleConfirm} className="w-full">
        {isEdit ? "Update" : "Insert"}
      </Button>
    </div>
  );
}
