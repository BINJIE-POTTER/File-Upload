import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Sparkles, X, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResume } from "../context";
import { type AIResumeData, validateAIResumeData } from "../types";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const CHAT_STORAGE_KEY = "resume-ai-chat";

type Message = { role: "user" | "assistant"; content: string };

type StoredChat = {
  messages: Message[];
  conversationId: string | null;
  updatedAt: number;
};

const loadChatFromStorage = (): StoredChat => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { messages: [], conversationId: null, updatedAt: 0 };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { messages: [], conversationId: null, updatedAt: 0 };
    const d = parsed as Record<string, unknown>;
    const messages = Array.isArray(d.messages)
      ? d.messages.filter(
          (m) => m && typeof m === "object" && m.role in { user: 1, assistant: 1 } && typeof (m as Message).content === "string"
        )
      : [];
    return {
      messages,
      conversationId: typeof d.conversationId === "string" ? d.conversationId : null,
      updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : 0,
    };
  } catch {
    return { messages: [], conversationId: null, updatedAt: 0 };
  }
};

const saveChatToStorage = (data: StoredChat) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }));
  } catch {
    // Ignore storage errors
  }
};

/** Extracts JSON from text, handling markdown code blocks. */
const extractJsonFromText = (text: string): string | null => {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceStart = trimmed.indexOf("{");
  if (braceStart >= 0) {
    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < trimmed.length; i++) {
      if (trimmed[i] === "{") depth++;
      if (trimmed[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end >= 0) return trimmed.slice(braceStart, end + 1);
  }
  return null;
};

type AIChatPanelProps = {
  onClose: () => void;
};

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const { importFromJson, color } = useResume();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      const stored = loadChatFromStorage();
      setMessages(stored.messages);
      setConversationId(stored.conversationId);
      setHasLoadedFromStorage(true);
    }
  }, [hasLoadedFromStorage]);

  const persistChat = useCallback((msgs: Message[], convId: string | null) => {
    saveChatToStorage({ messages: msgs, conversationId: convId, updatedAt: Date.now() });
  }, []);

  useEffect(() => {
    if (hasLoadedFromStorage && !isStreaming) {
      persistChat(messages, conversationId);
    }
  }, [messages, conversationId, isStreaming, hasLoadedFromStorage, persistChat]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
    persistChat([], null);
    toast.success("Chat cleared");
  }, [persistChat]);

  const handleTryApplyJson = useCallback(
    (text: string) => {
      const extracted = extractJsonFromText(text) ?? text;
      try {
        const parsed = JSON.parse(extracted) as unknown;
        if (validateAIResumeData(parsed)) {
          importFromJson(parsed as AIResumeData);
          toast.success("Resume updated from AI");
          return true;
        }
      } catch {
        // Not valid JSON, ignore
      }
      return false;
    },
    [importFromJson]
  );

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isStreaming) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: query }]);
    setStreamingContent("");
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/dify/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversation_id: conversationId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]" || data === "[done]") continue;
              try {
                const obj = JSON.parse(data);
                const isMessage = obj.event === "message" || obj.event === "agent_message";
                if (isMessage && typeof obj.answer === "string") {
                  fullText += obj.answer;
                  setStreamingContent(fullText);
                }
                if (obj.conversation_id) setConversationId(obj.conversation_id);
              } catch {
                // Skip non-JSON or partial lines
              }
            }
          }
        }
      }

      setStreamingContent("");
      setMessages((m) => [...m, { role: "assistant", content: fullText }]);

      const applied = handleTryApplyJson(fullText);
      if (!applied && fullText) {
        toast.info("AI response received. If it was meant to be resume JSON, ensure the format matches.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect to AI";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl no-print overflow-hidden"
      style={{
        width: "min(440px, calc(100vw - 3rem))",
        height: "min(560px, calc(100vh - 6rem))",
        resize: "both",
        minWidth: 340,
        minHeight: 400,
        maxWidth: "90vw",
        maxHeight: "85vh",
      }}
      role="dialog"
      aria-label="AI Assistant"
      aria-modal
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-gray-100"
        style={{ background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)` }}
      >
        <div className="flex items-center gap-3">
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
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isStreaming}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <span className="text-gray-300 cursor-grab" aria-label="Resize panel" title="Drag to resize">
            <GripVertical size={16} />
          </span>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && !streamingContent && (
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
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "rounded-br-md text-gray-800"
                  : "rounded-bl-md border border-gray-200 bg-white text-gray-700 shadow-sm"
              }`}
              style={msg.role === "user" ? { background: `${color}15`, color: "inherit" } : undefined}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words border border-gray-200 bg-white text-gray-700 shadow-sm">
              {streamingContent}
              <span
                className="inline-block w-2 h-4 ml-0.5 align-middle rounded-sm animate-pulse"
                style={{ background: color }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 pt-3 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to generate or improve your resume..."
            className="flex-1 min-h-[46px] max-h-28 px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50/80 resize-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 placeholder:text-gray-400"
            rows={1}
            disabled={isStreaming}
            aria-label="Message input"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-12 h-[46px] rounded-xl"
            style={{ background: color }}
            aria-label="Send"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
