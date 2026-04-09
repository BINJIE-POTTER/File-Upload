const CHAT_STORAGE_KEY = "resume-ai-chat";

/**
 * 聊天消息类型
 * role: 'user' | 'assistant' — 消息发送方
 * content: 消息文本内容
 */
export type Message = { role: "user" | "assistant"; content: string };

/**
 * 持久化到 localStorage 的聊天数据结构
 */
export interface StoredChat {
  messages: Message[];
  conversationId: string | null;
  updatedAt: number;
}

/**
 * 从 localStorage 加载聊天记录
 * 会验证数据格式，忽略不合法数据
 */
export function loadChatFromStorage(): StoredChat {
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
}

/**
 * 保存聊天记录到 localStorage
 * 忽略存储错误（如隐私模式或容量满）
 */
export function saveChatToStorage(data: StoredChat): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }));
  } catch {
    // Ignore storage errors
  }
}