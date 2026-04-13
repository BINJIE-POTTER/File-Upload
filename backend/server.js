import express from "express";
import cors from "cors";
import { PORT, DIFY_API_KEY, UPLOAD_DIR } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import uploadRouter from "./routes/upload.js";
import difyRouter from "./routes/dify.js";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/upload", uploadRouter);
app.use("/api/dify", difyRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, dify: !!DIFY_API_KEY });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!DIFY_API_KEY) console.warn("DIFY_API_KEY not set — AI chat will return 503");
});
