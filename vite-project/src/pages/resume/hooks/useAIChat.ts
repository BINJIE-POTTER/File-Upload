import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { sendDifyChat } from "@/services/chatApi";
import { loadChatFromStorage, saveChatToStorage, type Message } from "../utils/storage";
import { validateAIResumeData, type AIResumeData } from "../types";

/**
 * useAIChat - AI 聊天状态与逻辑 Hook
 *
 * 管理 AI 聊天面板的所有状态：
 * - 消息列表（user/assistant）
 * - 输入框状态
 * - 流式响应状态
 * - 对话 ID（用于多轮对话）
 * - 面板尺寸（可拖拽调整）
 * - 与 localStorage 的持久化同步
 *
 * 注意：本 Hook 不直接调用 importFromJson（避免与 useResume 的循环依赖）
 * 调用方应监听 appliedJson，在有值时自行调用 importFromJson
 */
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
  /** 尝试解析文本中的 JSON 格式简历数据；返回解析后的数据或 null */
  tryParseJson: (text: string) => AIResumeData | null;
}

export function useAIChat(): UseAIChatReturn {
  // ── 状态 ─────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [panelSize, setPanelSize] = useState({ w: 440, h: 560 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 保存最近一次 AI 回复文本（用于 showAppliedTip 判断）
  const lastAssistantTextRef = useRef("");

  // ── 挂载时从 localStorage 加载聊天记录 ────────────────────────────────────
  useEffect(() => {
    if (!hasLoadedFromStorage) {
      const stored = loadChatFromStorage();
      setMessages(stored.messages);
      setConversationId(stored.conversationId);
      setHasLoadedFromStorage(true);
    }
  }, [hasLoadedFromStorage]);

  // ── 消息或流式内容变化时持久化到 localStorage ──────────────────────────────
  useEffect(() => {
    if (hasLoadedFromStorage && !isStreaming) {
      saveChatToStorage({ messages, conversationId, updatedAt: Date.now() });
    }
  }, [messages, conversationId, isStreaming, hasLoadedFromStorage]);

  // ── 滚动到底部 ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // ── 清空聊天 ──────────────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
    lastAssistantTextRef.current = "";
    saveChatToStorage({ messages: [], conversationId: null, updatedAt: Date.now() });
    toast.success("Chat cleared");
  }, []);

  // ── 从文本中提取 JSON ─────────────────────────────────────────────────────
  /**
   * tryParseJson - 尝试从文本中解析 AI 简历 JSON
   *
   * 支持两种格式：
   * - Markdown 代码块包裹的 JSON（```json ... ```）
   * - 直接的 JSON 对象字符串
   *
   * @param text - AI 响应文本
   * @returns 解析成功返回 AIResumeData，否则返回 null
   */
  const tryParseJson = useCallback((text: string): AIResumeData | null => {
    const extracted = extractJsonFromText(text) ?? text;
    try {
      const parsed = JSON.parse(extracted) as unknown;
      if (validateAIResumeData(parsed)) {
        return parsed as AIResumeData;
      }
    } catch {
      // 不是合法 JSON，忽略
    }
    return null;
  }, []);

  // ── 发送消息 ──────────────────────────────────────────────────────────────
  /**
   * 发送用户消息到 Dify API
   * 处理响应并更新消息列表
   * 流式响应暂未实现（blocking mode）
   */
  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || isStreaming) return;

    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query };
    setMessages((m) => [...m, userMsg]);
    setStreamingContent("");
    setIsStreaming(true);

    try {
      const data = await sendDifyChat({
        query,
        conversation_id: conversationId ?? undefined,
      });

      // Blocking mode 返回 { event, answer, conversation_id, ... }
      const fullText = typeof data.answer === "string" ? data.answer : "";
      if (data.conversation_id) setConversationId(data.conversation_id);

      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: fullText };
      lastAssistantTextRef.current = fullText;
      setStreamingContent("");
      setMessages((m) => [...m, assistantMsg]);

      // 提示用户 AI 已返回 JSON 格式数据
      if (fullText.trim()) {
        toast.info("AI response received. If it contains resume JSON, it will be imported automatically.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect to AI";
      toast.error(msg);
      const errMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: `Error: ${msg}` };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, conversationId]);

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
    tryParseJson,
  };
}

/**
 * extractJsonFromText - 从文本中提取 JSON 字符串
 *
 * 支持两种格式：
 * - Markdown 代码块：```json ... ``` 或 ``` ...
 * - 直接 JSON 对象：{ ... }
 *
 * @param text - 原始文本
 * @returns JSON 字符串或 null
 */
function extractJsonFromText(text: string): string | null {
  const trimmed = text.trim();
  // 匹配 Markdown 代码块
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // 匹配直接 JSON 对象
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
