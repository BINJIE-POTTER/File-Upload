import SparkMD5 from "spark-md5";
import type { HashWorkerInput, HashWorkerOutput, ChunkHash } from "../types";

/**
 * 发送消息到主线程
 * @param msg 消息
 */
const postMsg = (msg: HashWorkerOutput) => self.postMessage(msg);

self.onmessage = async (e: MessageEvent<HashWorkerInput>) => {
  const { file, chunkSize } = e.data;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileSpark = new SparkMD5.ArrayBuffer();
  const chunks: ChunkHash[] = [];

  /** 计算文件MD5 */
  try {
    /** 计算每个分片的MD5 */
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const buffer = await file.slice(start, end).arrayBuffer();

      fileSpark.append(buffer);

      const chunkSpark = new SparkMD5.ArrayBuffer();
      chunkSpark.append(buffer);
      chunks.push({ index: i, start, end, md5: chunkSpark.end() });

      postMsg({ type: "progress", current: i + 1, total: totalChunks });
    }

    postMsg({ type: "complete", fileMd5: fileSpark.end(), chunks });
  } catch (err) {
    postMsg({
      type: "error",
      message: err instanceof Error ? err.message : "Hash calculation failed",
    });
  }
};
