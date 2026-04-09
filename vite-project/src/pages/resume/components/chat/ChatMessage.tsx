import { Bot, User } from "lucide-react";
import type { Message } from "../../utils/storage";

interface ChatMessageProps {
  message: Message;
  color: string;
  isStreaming?: boolean;
}

export function ChatMessage({ message, color, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {message.role === "assistant" && (
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${color}20`, color }}
          aria-hidden
        >
          <Bot size={16} />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "rounded-br-md text-gray-800"
            : "rounded-bl-md border border-gray-200 bg-white text-gray-700 shadow-sm"
        }`}
        style={isUser ? { background: `${color}15`, color: "inherit" } : undefined}
      >
        {message.content}
        {isStreaming && (
          <span
            className="inline-block w-2 h-4 ml-0.5 align-middle rounded-sm animate-pulse"
            style={{ background: color }}
          />
        )}
      </div>
      {message.role === "user" && (
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600">
          <User size={16} aria-hidden />
        </div>
      )}
    </div>
  );
}

interface StreamingIndicatorProps {
  color: string;
}

export function StreamingIndicator({ color }: StreamingIndicatorProps) {
  return (
    <div className="flex gap-2.5 justify-start">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `${color}20`, color }}
        aria-hidden
      >
        <Bot size={16} />
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-bl-md px-4 py-2.5 border border-gray-200 bg-white shadow-sm flex gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}