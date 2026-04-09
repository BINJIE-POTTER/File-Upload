import { useRef } from "react";
import { Bot, GripVertical, Sparkles, Trash2, X } from "lucide-react";
import { useAIChat } from "../../hooks/useAIChat";
import { ChatMessage, StreamingIndicator } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useResume } from "../../context";

type AIChatPanelProps = {
  onClose: () => void;
};

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const { color } = useResume();
  const {
    messages,
    input,
    setInput,
    streamingContent,
    isStreaming,
    panelSize,
    setPanelSize,
    sendMessage,
    clearMessages,
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
    const onMove = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const { x, y, w, h } = resizeStartRef.current;
      const dw = x - ev.clientX;
      const dh = y - ev.clientY;
      setPanelSize({
        w: Math.min(Math.max(340, w + dw), globalThis.innerWidth * 0.9),
        h: Math.min(Math.max(400, h + dh), globalThis.innerHeight * 0.85),
      });
    };
    const onUp = () => {
      resizeStartRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl no-print overflow-hidden"
      style={{
        width: panelSize.w,
        height: panelSize.h,
        minWidth: 340,
        minHeight: 400,
      }}
      role="dialog"
      aria-label="AI Assistant"
      aria-modal
    >
      {/* Header */}
      <ChatHeader
        color={color}
        onClose={onClose}
        onClear={clearMessages}
        onResizeStart={handleResizeStart}
        canClear={messages.length > 0}
        isStreaming={isStreaming}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && !streamingContent && (
          <ChatEmpty color={color} />
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} color={color} />
        ))}
        {isStreaming && !streamingContent && (
          <StreamingIndicator color={color} />
        )}
        {streamingContent && (
          <ChatMessage
            message={{ role: "assistant", content: streamingContent }}
            color={color}
            isStreaming
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 pt-3 border-t border-gray-100 bg-white">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          isStreaming={isStreaming}
          color={color}
        />
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  color: string;
  onClose: () => void;
  onClear: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  canClear: boolean;
  isStreaming: boolean;
}

function ChatHeader({ color, onClose, onClear, onResizeStart, canClear, isStreaming }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-gray-100"
      style={{ background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)` }}
    >
      <div className="flex items-center gap-3">
        <span
          role="button"
          tabIndex={0}
          onMouseDown={onResizeStart}
          className="cursor-nwse-resize touch-none p-0.5 -m-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100/80"
          aria-label="Drag to resize"
          title="Drag to resize"
        >
          <GripVertical size={16} />
        </span>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: `${color}20`, color }}
        >
          <Bot size={20} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">AI Assistant</h2>
          <p className="text-xs text-gray-500">Generate or refine your resume</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {canClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={isStreaming}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

interface ChatEmptyProps {
  color: string;
}

function ChatEmpty({ color }: ChatEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${color}15`, color }}
      >
        <Sparkles size={28} aria-hidden />
      </div>
      <p className="text-gray-700 font-medium text-sm mb-1">Ask the AI anything</p>
      <p className="text-gray-500 text-xs max-w-[260px]">
        Request resume improvements or new content. Output should be JSON: name, lines, sections.
      </p>
    </div>
  );
}