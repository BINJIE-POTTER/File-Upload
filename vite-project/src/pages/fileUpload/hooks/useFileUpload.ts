import { useCallback, useRef, useState } from "react";
import { calculateFileHash } from "../utils/fileHash";
import { checkMd5, uploadChunk, mergeChunks } from "@/services/upload";
import type { UploadStatus } from "@/services/types/upload";
import type { ChunkHash } from "../types";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENCY = 3;

/** 上传状态 */
export interface UploadState {
  /** 任务ID */
  id: string;
  /** 文件 */
  file: File;
  /** 上传状态 */
  status: UploadStatus;
  /** 计算MD5进度 */
  hashProgress: number;
  /** 上传进度 */
  uploadProgress: number;
  /** 错误消息 */
  errorMessage: string;
}

/** 上传任务句柄 */
interface TaskHandle {
  /** 取消请求控制器 */
  abortController: AbortController;
  /** 取消计算MD5 */
  cancelHash: () => void;
}

/** 上传文件分片 */
const uploadChunks = async (
  uploadId: string,
  file: File,
  chunks: ChunkHash[],
  uploadedSet: Set<number>,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
) => {
  const pending = chunks.filter((c) => !uploadedSet.has(c.index));
  let completed = uploadedSet.size;
  const total = chunks.length;

  onProgress(Math.round((completed / total) * 100));

  const pool: Promise<void>[] = [];
  let idx = 0;

  /** 在所有分片上传完成之前，上传下一个分片 */
  const next = async (): Promise<void> => {
    while (idx < pending.length) {
      if (signal.aborted) return;
      const chunk = pending[idx++];
      const blob = file.slice(chunk.start, chunk.end);
      await uploadChunk(
        { uploadId, chunkIndex: chunk.index, chunkData: blob, chunkMd5: chunk.md5 },
        signal,
      );
      completed++;
      onProgress(Math.round((completed / total) * 100));
    }
  };

  /** 并发上传文件分片（限制并发数） */
  for (let i = 0; i < Math.min(CONCURRENCY, pending.length); i++) {
    pool.push(next());
  }

  await Promise.all(pool);
};

export const useFileUpload = () => {
  const [tasks, setTasks] = useState<Map<string, UploadState>>(new Map());
  const handlesRef = useRef<Map<string, TaskHandle>>(new Map());

  /** 更新上传状态 */
  const patch = useCallback((taskId: string, partial: Partial<UploadState>) => {
    setTasks((prev) => {
      const current = prev.get(taskId);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(taskId, { ...current, ...partial });
      return next;
    });
  }, []);

  /** 上传单个文件 */
  const runSingleUpload = useCallback(
    async (taskId: string, file: File) => {
      const controller = new AbortController();
      const { promise: hashPromise, cancel: cancelHash } = calculateFileHash(
        file,
        CHUNK_SIZE,
        (percent) => patch(taskId, { hashProgress: percent }),
      );

      handlesRef.current.set(taskId, { abortController: controller, cancelHash });

      try {
        const { fileMd5, chunks } = await hashPromise;

        if (controller.signal.aborted) return;
        patch(taskId, { status: "uploading" });

        /** 检查文件是否已存在（秒传） */
        const checkRes = await checkMd5(
          { md5: fileMd5, filename: file.name, fileSize: file.size, chunkSize: CHUNK_SIZE, totalChunks: chunks.length },
          controller.signal,
        );

        if (checkRes.data.exists) {
          patch(taskId, { status: "success", uploadProgress: 100 });
          return;
        }

        const uploadId = checkRes.data.uploadId!;
        const uploadedSet = new Set(checkRes.data.uploadedChunks ?? []);

        /** 上传文件分片 */
        await uploadChunks(uploadId, file, chunks, uploadedSet, controller.signal, (percent) =>
          patch(taskId, { uploadProgress: percent }),
        );

        if (controller.signal.aborted) return;
        patch(taskId, { status: "merging" });

        /** 合并文件分片 */
        await mergeChunks(
          { uploadId, filename: file.name, totalChunks: chunks.length, md5: fileMd5 },
          controller.signal,
        );

        patch(taskId, { status: "success", uploadProgress: 100 });
      } catch (err) {
        if (controller.signal.aborted) return;
        patch(taskId, {
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Upload failed",
        });
      } finally {
        handlesRef.current.delete(taskId);
      }
    },
    [patch],
  );

  /** 上传所有文件 */
  const handleUpload = useCallback(
    (files: File[]) => {
      /** 初始化上传任务Map */
      const newEntries: [string, UploadState][] = files.map((file) => {
        const id = crypto.randomUUID();
        return [
          id,
          {
            id,
            file,
            status: "hashing" as const,
            hashProgress: 0,
            uploadProgress: 0,
            errorMessage: "",
          }
        ];
      });

      setTasks((prev) => {
        const next = new Map(prev);
        for (const [id, state] of newEntries) next.set(id, state);
        return next;
      });

      for (const [id, state] of newEntries) {
        runSingleUpload(id, state.file);
      }
    },
    [runSingleUpload],
  );

  /** 取消上传单个任务*/
  const handleCancel = useCallback(
    (taskId: string) => {
      const handle = handlesRef.current.get(taskId);
      if (handle) {
        handle.abortController.abort();
        handle.cancelHash();
        handlesRef.current.delete(taskId);
      }
      setTasks((prev) => {
        const next = new Map(prev);
        next.delete(taskId);
        return next;
      });
    },
    [],
  );

  /** 取消所有上传任务*/
  const handleCancelAll = useCallback(() => {
    for (const [, handle] of handlesRef.current) {
      handle.abortController.abort();
      handle.cancelHash();
    }
    handlesRef.current.clear();
    setTasks(new Map());
  }, []);

  /** 删除上传单个任务*/
  const handleRemove = useCallback((taskId: string) => {
    setTasks((prev) => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  return { tasks, handleUpload, handleCancel, handleCancelAll, handleRemove };
};
