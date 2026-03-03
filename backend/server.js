/**
 * File Upload & Dify Chat Proxy Backend
 * - Chunked file upload (placeholder routes)
 * - Dify chat-messages API proxy with streaming
 */
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ?? 3001;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_BASE_URL = (process.env.DIFY_BASE_URL ?? "https://api.dify.ai/v1").replace(/\/$/, "");

app.use(cors({ origin: true }));
app.use(express.json());

// ── Dify Chat Proxy (streaming) ─────────────────────────────────────────
app.post("/api/dify/chat", async (req, res) => {
  if (!DIFY_API_KEY) {
    return res.status(503).json({
      code: "dify_unconfigured",
      message: "DIFY_API_KEY is not set. Add it to your backend .env file.",
    });
  }

  const { query, conversation_id, inputs = {} } = req.body ?? {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ code: "invalid_param", message: "query is required" });
  }

  const user = req.body?.user ?? `user-${Date.now()}`;
  const body = {
    query,
    user,
    response_mode: "streaming",
    conversation_id: conversation_id ?? "",
    inputs,
  };

  try {
    const difyRes = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIFY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!difyRes.ok) {
      const err = await difyRes.json().catch(() => ({}));
      return res.status(difyRes.status).json({
        code: err.code ?? "dify_error",
        message: err.message ?? difyRes.statusText,
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = difyRes.body;
    if (!reader) {
      res.end();
      return;
    }

    for await (const chunk of reader) {
      res.write(chunk);
      if (typeof res.flush === "function") res.flush();
    }
    res.end();
  } catch (err) {
    console.error("Dify proxy error:", err);
    res.status(500).json({
      code: "proxy_error",
      message: err?.message ?? "Failed to reach Dify API",
    });
  }
});

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ ok: true, dify: !!DIFY_API_KEY });
});

// ── Upload placeholder routes (stub for existing API surface) ─────────────
app.get("/api/upload/check", (_req, res) => res.json({ exists: false }));
app.get("/api/upload/progress", (_req, res) => res.json({ progress: 0 }));
app.post("/api/upload/multipart", (_req, res) => res.status(501).json({ message: "Not implemented" }));
app.post("/api/upload/part", (_req, res) => res.status(501).json({ message: "Not implemented" }));
app.post("/api/upload/file", (_req, res) => res.status(501).json({ message: "Not implemented" }));
app.post("/api/upload/merge", (_req, res) => res.status(501).json({ message: "Not implemented" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!DIFY_API_KEY) console.warn("DIFY_API_KEY not set — AI chat will return 503");
});
