import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  color: string;
}

export function ChatInput({ value, onChange, onSend, isStreaming, color }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`; // max 28px * 4 rows
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask AI to generate or improve your resume..."
        className="flex-1 min-h-[46px] max-h-28 px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50/80 resize-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 placeholder:text-gray-400"
        rows={1}
        disabled={isStreaming}
        aria-label="Message input"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={!value.trim() || isStreaming}
        className="shrink-0 w-12 h-[46px] rounded-xl"
        style={{ background: color }}
        aria-label="Send"
      >
        <Send size={18} />
      </Button>
    </div>
  );
}