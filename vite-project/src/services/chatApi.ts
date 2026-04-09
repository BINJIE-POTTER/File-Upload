const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface ChatRequest {
  query: string;
  conversation_id?: string;
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
}

export interface ChatError {
  message?: string;
}

export async function sendDifyChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/dify/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await res.json();

  if (!res.ok) {
    const error = data as ChatError;
    throw new Error(error.message ?? `Request failed: ${res.status}`);
  }

  return data as ChatResponse;
}