import type { FileHashResult, HashWorkerOutput } from "../types";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const createWorker = () =>
  new Worker(new URL("../workers/hashWorker.ts", import.meta.url), {
    type: "module",
  });

export const calculateFileHash = (
  file: File,
  chunkSize = DEFAULT_CHUNK_SIZE,
  onProgress?: (percent: number) => void,
): { promise: Promise<FileHashResult>; cancel: () => void } => {
  const worker = createWorker();
  let cancelled = false;

  const promise = new Promise<FileHashResult>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<HashWorkerOutput>) => {
      if (cancelled) return;
      const msg = e.data;

      if (msg.type === "progress") {
        onProgress?.(Math.round((msg.current / msg.total) * 100));
      } else if (msg.type === "complete") {
        worker.terminate();
        resolve({ fileMd5: msg.fileMd5, chunks: msg.chunks });
      } else {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ file, chunkSize });
  });

  const cancel = () => {
    cancelled = true;
    worker.terminate();
  };

  return { promise, cancel };
};
