import { mkdir, readdir, rm, writeFile, stat } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { UPLOAD_DIR, CHUNK_DIR } from "../config/index.js";

/** 内存中的上传会话注册表：uploadId → session 元数据 */
const sessions = new Map();

/** 确保上传目录和分片目录存在 */
const ensureDirs = async () => {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await mkdir(CHUNK_DIR, { recursive: true });
};

/** 获取上传会话目录 */
const getSessionDir = (uploadId) => join(CHUNK_DIR, uploadId);

/** 获取分片路径 */
const getChunkPath = (uploadId, index) =>
  join(getSessionDir(uploadId), String(index));

/**
 * 检查文件是否已存在（秒传）。
 * 如果不存在，创建一个上传会话并返回其 ID + 已上传的分片索引。
 * @param md5 文件MD5
 * @param filename 文件名
 * @param fileSize 文件大小
 * @param chunkSize 分片大小
 * @param totalChunks 分片总数
 * @returns 文件是否存在
 */
export const checkFile = async (md5, filename, fileSize, chunkSize, totalChunks) => {
  await ensureDirs();

  const existing = [...sessions.values()].find(
    (s) => s.md5 === md5 && s.merged,
  );
  /** 文件已存在（秒传） */
  if (existing) {
    return { exists: true, url: `/uploads/${existing.filename}` };
  }

  const finalPath = join(UPLOAD_DIR, `${md5}_${filename}`);
  try {
    await stat(finalPath);
    return { exists: true, url: `/uploads/${md5}_${filename}` };
  } catch {
    // file does not exist — continue
  }

  const existingSession = [...sessions.entries()].find(
    ([, s]) => s.md5 === md5 && !s.merged,
  );
  /** 文件不存在（断点续传） */
  if (existingSession) {
    const [uploadId, session] = existingSession;
    const uploadedChunks = await getUploadedChunkIndices(uploadId, session.totalChunks);
    return { exists: false, uploadId, uploadedChunks };
  }

  const uploadId = randomUUID();
  sessions.set(uploadId, { md5, filename, fileSize, chunkSize, totalChunks, merged: false });
  await mkdir(getSessionDir(uploadId), { recursive: true });

  return { exists: false, uploadId, uploadedChunks: [] };
};

/**
 * 保存单个分片到磁盘。
 * @param uploadId 上传会话ID
 * @param chunkIndex 分片索引
 * @param buffer 分片数据
 * @returns 保存成功
 */
export const saveChunk = async (uploadId, chunkIndex, buffer) => {
  const session = sessions.get(uploadId);
  if (!session) throw Object.assign(new Error("Invalid uploadId"), { status: 404 });

  await writeFile(getChunkPath(uploadId, chunkIndex), buffer);
  return { success: true };
};

/**
 * 合并所有分片到最终文件。
 * @param uploadId 上传会话ID
 * @param filename 文件名
 * @param totalChunks 分片总数
 * @param md5 文件MD5
 * @returns 合并成功
 */
export const mergeFile = async (uploadId, filename, totalChunks, md5) => {
  const session = sessions.get(uploadId);
  if (!session) throw Object.assign(new Error("Invalid uploadId"), { status: 404 });

  const sessionDir = getSessionDir(uploadId);
  const finalFilename = `${md5}_${filename}`;
  const finalPath = join(UPLOAD_DIR, finalFilename);

  const writeStream = createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = getChunkPath(uploadId, i);
    await pipeline(createReadStream(chunkPath), writeStream, { end: false });
  }

  writeStream.end();
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  await rm(sessionDir, { recursive: true, force: true });

  session.merged = true;
  session.filename = finalFilename;

  return { success: true, url: `/uploads/${finalFilename}`, fileId: uploadId };
};

/**
 * 终止上传会话并清理分片。
 * @param uploadId 上传会话ID
 * @returns 终止成功
 */
export const terminateUpload = async (uploadId) => {
  const session = sessions.get(uploadId);
  if (!session) throw Object.assign(new Error("Invalid uploadId"), { status: 404 });

  await rm(getSessionDir(uploadId), { recursive: true, force: true });
  sessions.delete(uploadId);

  return { success: true };
};

/**
 * 扫描会话目录并返回已上传的分片索引。
 * @param uploadId 上传会话ID
 * @param totalChunks 分片总数
 * @returns 已上传的分片索引
 */
const getUploadedChunkIndices = async (uploadId, totalChunks) => {
  const dir = getSessionDir(uploadId);
  try {
    const files = await readdir(dir);
    return files
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 0 && n < totalChunks)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
};
