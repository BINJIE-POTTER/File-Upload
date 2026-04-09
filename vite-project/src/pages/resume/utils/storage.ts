const CHAT_STORAGE_KEY = "resume-ai-chat";

export type Message = { role: "user" | "assistant"; content: string };

export interface StoredChat {
  messages: Message[];
  conversationId: string | null;
  updatedAt: number;
}

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

export function saveChatToStorage(data: StoredChat): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }));
  } catch {
    // Ignore storage errors
  }
}