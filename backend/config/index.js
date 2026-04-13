import "dotenv/config";
import { resolve } from "node:path";

export const PORT = process.env.PORT ?? 3001;

export const DIFY_API_KEY = process.env.DIFY_API_KEY ?? "";
export const DIFY_BASE_URL = (process.env.DIFY_BASE_URL ?? "https://api.dify.ai/v1").replace(/\/$/, "");

export const UPLOAD_DIR = resolve("uploads");
export const CHUNK_DIR = resolve("uploads/chunks");
