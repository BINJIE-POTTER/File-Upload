import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AIResumeData } from "../types";

type ImportJsonPanelProps = {
  onConfirm: (data: AIResumeData) => void;
  onClose: () => void;
};

const validateAIResumeData = (data: unknown): data is AIResumeData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.name !== "string") return false;
  if (!Array.isArray(d.lines) || !d.lines.every((l) => typeof l === "string")) return false;
  if (!Array.isArray(d.sections)) return false;
  for (const s of d.sections as unknown[]) {
    if (!s || typeof s !== "object") return false;
    const sec = s as Record<string, unknown>;
    if (typeof sec.title !== "string") return false;
    if (sec.sub !== undefined && typeof sec.sub !== "string") return false;
    if (!Array.isArray(sec.items) || !sec.items.every((i) => typeof i === "string")) return false;
  }
  return true;
};

export function ImportJsonPanel({ onConfirm, onClose }: ImportJsonPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Import from JSON"
      aria-modal
    >
      <div
        className="w-full max-w-lg rounded-lg border bg-popover shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
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
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
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
