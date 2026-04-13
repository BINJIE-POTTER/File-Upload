import { useRef, useEffect } from "react";
import { Bot, GripVertical, Sparkles, Trash2, X } from "lucide-react";
import { useAIChat } from "../../hooks/useAIChat";
import { ChatMessage, StreamingIndicator } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useResume } from "../../useResume";
import { toast } from "sonner";

type AIChatPanelProps = {
  onClose: () => void;
};

interface ChatHeaderProps {
  color: string;
  onClose: () => void;
  onClear: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  canClear: boolean;
  isStreaming: boolean;
}

interface ChatEmptyProps {
  color: string;
}

/**
 * AIChatPanel - AI 助手聊天面板
 *
 * 功能：
 * - 可拖拽调整大小的悬浮面板（右下角固定定位）
 * - 消息列表展示（用户/助手消息气泡）
 * - 流式响应支持（显示加载动画和实时内容）
 * - 从 localStorage 恢复聊天历史
 * - AI 响应自动尝试导入为简历 JSON
 *
 * @param onClose - 关闭面板回调
 */
export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const { color, importFromJson } = useResume();
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
    tryParseJson,
  } = useAIChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  // 记录最近一次自动导入的 assistant 消息 ID，避免重复导入
  const lastParsedMsgIdRef = useRef<string | null>(null);

  // ── 新消息到达时自动尝试导入 JSON ─────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    // 只处理新的 assistant 消息（避免重复解析同一消息）
    if (last.role !== "assistant" || last.id === lastParsedMsgIdRef.current) return;
    lastParsedMsgIdRef.current = last.id;

    const data = tryParseJson(last.content);
    if (data) {
      importFromJson(data);
      toast.success("简历已从 AI 响应中导入");
    }
  }, [messages, tryParseJson, importFromJson]);

  // ── 拖拽调整大小 ─────────────────────────────────────────────────────────
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
      {/* 头部：标题、清空按钮、关闭按钮、拖拽手柄 */}
      <ChatHeader
        color={color}
        onClose={onClose}
        onClear={clearMessages}
        onResizeStart={handleResizeStart}
        canClear={messages.length > 0}
        isStreaming={isStreaming}
      />

      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && !streamingContent && (
          <ChatEmpty color={color} />
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} color={color} />
        ))}
        {isStreaming && !streamingContent && (
          <StreamingIndicator color={color} />
        )}
        {streamingContent && (
          <ChatMessage
            message={{ id: "streaming", role: "assistant", content: streamingContent }}
            color={color}
            isStreaming
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
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

/**
 * ChatHeader - 聊天面板头部组件
 *
 * @param color - 主题色
 * @param onClose - 关闭回调
 * @param onClear - 清空聊天回调
 * @param onResizeStart - 开始拖拽回调
 * @param canClear - 是否可以清空（无消息时隐藏按钮）
 * @param isStreaming - 是否正在流式输出
 */
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

/**
 * ChatEmpty - 空状态提示组件
 * 当没有消息时显示引导用户使用的提示
 */
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