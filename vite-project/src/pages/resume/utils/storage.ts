const CHAT_STORAGE_KEY = "resume-ai-chat";

/**
 * 聊天消息类型
 * role: 'user' | 'assistant' — 消息发送方
 * content: 消息文本内容
 * id: 唯一标识符（用于 React key 和去重）
 */
export type Message = { id: string; role: "user" | "assistant"; content: string };

/**
 * 生成聊天消息唯一 ID
 */
const msgId = () => crypto.randomUUID();

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
 * 自动为旧数据（无 id 字段）补充 id
 */
export function loadChatFromStorage(): StoredChat {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { messages: [], conversationId: null, updatedAt: 0 };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { messages: [], conversationId: null, updatedAt: 0 };
    const d = parsed as Record<string, unknown>;
    const messages: Message[] = Array.isArray(d.messages)
      ? d.messages
          .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
          .filter((m) => {
            const role = m.role;
            return (role === "user" || role === "assistant") && typeof m.content === "string";
          })
          .map((m) => ({
            id: (m.id as string) || msgId(),
            role: m.role as "user" | "assistant",
            content: m.content as string,
          }))
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
 * 检测 localStorage 剩余可用空间（估算）
 * @returns 剩余字节数（估算值）
 */
function getStorageRemaining(): number {
  try {
    const testKey = "__storage_test__";
    let remaining = 0;
    // 尝试写入直到失败
    for (let i = 0; i < 1024 * 1024; i += 4096) {
      try {
        localStorage.setItem(testKey, "a".repeat(4096));
        localStorage.removeItem(testKey);
        remaining += 4096;
      } catch {
        break;
      }
    }
    return remaining;
  } catch {
    return 0;
  }
}

/**
 * 保存聊天记录到 localStorage
 * 容量不足时给出友好提示
 */
export function saveChatToStorage(data: StoredChat): void {
  try {
    const serialized = JSON.stringify({ ...data, updatedAt: Date.now() });
    const size = new Blob([serialized]).size;
    const remaining = getStorageRemaining();

    if (remaining > 0 && size > remaining * 0.9) {
      console.warn("[storage] localStorage 容量接近上限，尝试清理…");
      // 保留最近一半消息以释放空间
      const trimmed: StoredChat = {
        ...data,
        messages: data.messages.slice(-Math.floor(data.messages.length / 2)),
        updatedAt: Date.now(),
      };
      const trimmedSerialized = JSON.stringify(trimmed);
      localStorage.setItem(CHAT_STORAGE_KEY, trimmedSerialized);
      return;
    }

    localStorage.setItem(CHAT_STORAGE_KEY, serialized);
  } catch {
    // 容量满或其他错误，尝试清理旧数据后重试
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      const minimal: StoredChat = { messages: [], conversationId: null, updatedAt: Date.now() };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // 完全无法写入，忽略
    }
  }
}

/**
 * 清理所有聊天存储数据
 */
export function clearChatStorage(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // 忽略
  }
}