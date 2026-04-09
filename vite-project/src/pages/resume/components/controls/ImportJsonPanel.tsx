import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AIResumeData, validateAIResumeData } from "../../types";

type ImportJsonPanelProps = {
  onConfirm: (data: AIResumeData) => void;
  onClose: () => void;
};

/**
 * ImportJsonPanel - JSON 导入面板
 *
 * 模态对话框，用于粘贴和导入 AI 生成的简历 JSON 数据
 *
 * @param onConfirm - 确认导入回调
 * @param onClose - 关闭回调
 */
export function ImportJsonPanel({ onConfirm, onClose }: ImportJsonPanelProps) {
  // ── 状态 ─────────────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── 自动聚焦 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── 确认导入 ─────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please paste JSON content");
      return;
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!validateAIResumeData(parsed)) {
        setError("Invalid format: needs name, lines (string[]), sections ({ title, sub?, items: string[] }[])");
        return;
      }
      onConfirm(parsed);
      onClose();
    } catch (e) {
      setError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : "Failed to parse JSON");
    }
  };

  // ── ESC 关闭 ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    /* 遮罩层 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Import from JSON"
      aria-modal
    >
      {/* 面板内容 */}
      <div
        className="w-full max-w-lg rounded-lg border bg-popover shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-sm">Import from JSON</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-accent"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 输入区域 */}
        <div className="p-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder='{"name":"...","lines":["..."],"sections":[{"title":"...","items":["..."]}]}'
            className="w-full h-40 px-3 py-2 text-sm font-mono rounded border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
            aria-label="JSON content"
            aria-invalid={!!error}
          />
          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Import
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
