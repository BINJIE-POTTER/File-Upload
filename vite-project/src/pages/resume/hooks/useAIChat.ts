import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { sendDifyChat } from "@/services/chatApi";
import { loadChatFromStorage, saveChatToStorage, type Message } from "../utils/storage";
import { useResume } from "../context";
import { validateAIResumeData, type AIResumeData } from "../types";

interface UseAIChatReturn {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  streamingContent: string;
  isStreaming: boolean;
  conversationId: string | null;
  panelSize: { w: number; h: number };
  setPanelSize: (v: { w: number; h: number }) => void;
  sendMessage: () => Promise<void>;
  clearMessages: () => void;
  handleTryApplyJson: (text: string) => boolean;
}

export function useAIChat(): UseAIChatReturn {
  const { importFromJson } = useResume();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [panelSize, setPanelSize] = useState({ w: 440, h: 560 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from storage on mount
  useEffect(() => {
    if (!hasLoadedFromStorage) {
      const stored = loadChatFromStorage();
      setMessages(stored.messages);
      setConversationId(stored.conversationId);
      setHasLoadedFromStorage(true);
    }
  }, [hasLoadedFromStorage]);

  // Persist to storage on change
  useEffect(() => {
    if (hasLoadedFromStorage && !isStreaming) {
      saveChatToStorage({ messages, conversationId, updatedAt: Date.now() });
    }
  }, [messages, conversationId, isStreaming, hasLoadedFromStorage]);

  // Scroll to bottom
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
    saveChatToStorage({ messages: [], conversationId: null, updatedAt: Date.now() });
    toast.success("Chat cleared");
  }, []);

  const handleTryApplyJson = useCallback(
    (text: string): boolean => {
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

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || isStreaming) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: query }]);
    setStreamingContent("");
    setIsStreaming(true);

    try {
      const data = await sendDifyChat({
        query,
        conversation_id: conversationId ?? undefined,
      });

      // Blocking mode returns { event, answer, conversation_id, ... }
      const fullText = typeof data.answer === "string" ? data.answer : "";
      if (data.conversation_id) setConversationId(data.conversation_id);

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

  return {
    messages,
    input,
    setInput,
    streamingContent,
    isStreaming,
    conversationId,
    panelSize,
    setPanelSize,
    sendMessage,
    clearMessages: handleClearChat,
    handleTryApplyJson,
  };
}

/** Extracts JSON from text, handling markdown code blocks. */
function extractJsonFromText(text: string): string | null {
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
}