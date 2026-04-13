import { AppError } from "../utils/AppError.js";
import { DIFY_API_KEY, DIFY_BASE_URL } from "../config/index.js";

export const chat = async (req, res) => {
  if (!DIFY_API_KEY) throw new AppError(503, "DIFY_API_KEY is not set. Add it to your backend .env file.");

  const { query, conversation_id, inputs = {} } = req.body ?? {};
  if (!query || typeof query !== "string") throw new AppError(400, "query is required");

  const user = req.body?.user ?? "user-mock";

  const difyRes = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIFY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      user,
      response_mode: "blocking",
      conversation_id: conversation_id ?? "",
      inputs,
    }),
  });

  if (!difyRes.ok) {
    const err = await difyRes.json().catch(() => ({}));
    throw new AppError(difyRes.status, err.message ?? difyRes.statusText);
  }

  const data = await difyRes.json();

  if (!data.conversation_id || !data.answer) {
    throw new AppError(502, data.message ?? "Unexpected Dify response format");
  }

  res.json(data);
};
