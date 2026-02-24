import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { md5 } from '@/utils/md5';
import {
  checkFileExists,
  getUploadProgress,
  createMultipartUpload,
  uploadChunk,
  uploadFile,
  mergeChunks,
} from '@/service/upload';
import type { UploadFileItem, UploadFileConfig } from '@/service/type/upload';

const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

// Store active uploads for pause/resume
const activeUploads = new Map<string, { controller: AbortController; queue: Promise<any>[] }>();

export function useFileUpload(config: UploadFileConfig) {
  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const retryTimerRef = useRef<number | null>(null);

  // Update file in list
  const updateFile = useCallback((uid: string, updates: Partial<UploadFileItem>) => {
    setFileList((prev) =>
      prev.map((file) => (file.uid === uid ? { ...file, ...updates } : file))
    );
  }, []);

  // Calculate upload speed
  const calculateSpeed = useCallback((uploadedSize: number, startTime: number): string => {
    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
    if (elapsedTime === 0) return '0';
    const speed = uploadedSize / 1024 / 1024 / elapsedTime; // MB/s
    return speed.toFixed(2);
  }, []);

  // Upload chunks with retry
  const uploadChunkWithRetry = async (
    file: File,
    identifier: string,
    partNumber: number,
    chunkSize: number,
    retries = 3
  ): Promise<void> => {
    const start = (partNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await uploadChunk({
          uploadId: identifier,
          partNumber,
          chunk,
        });
        return;
      } catch (error) {
        if (attempt === retries - 1) throw error;
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  };

  // Handle chunked upload
  const handleChunkedUpload = async (file: File, uid: string, identifier: string) => {
    const chunkSize = config.chunkSize || DEFAULT_CHUNK_SIZE;
    const maxConcurrent = config.maxConcurrent || DEFAULT_MAX_CONCURRENT;

    try {
      // Check if file already exists
      const checkResult = await checkFileExists(identifier);
      if (checkResult.code === 200 && checkResult.data?.exists) {
        updateFile(uid, {
          status: 'success',
          progress: 100,
          url: checkResult.data.path,
          fileId: identifier,
        });
        toast.success(`${file.name} already uploaded`);
        return;
      }

      // Get or create upload task
      let taskResponse = await getUploadProgress(identifier);
      
      if (!taskResponse.data) {
        const createResult = await createMultipartUpload({
          identifier,
          fileName: file.name,
          totalSize: file.size,
          chunkSize,
          contentType: file.type,
        });

        if (createResult.code !== 200) {
          throw new Error(createResult.msg || 'Failed to create upload task');
        }

        taskResponse = createResult;
      }

      if (!taskResponse.data) {
        throw new Error('No task data');
      }

      const task = taskResponse.data;

      // If already finished
      if (task.finished && task.path) {
        updateFile(uid, {
          status: 'success',
          progress: 100,
          url: task.path,
          fileId: identifier,
        });
        toast.success(`${file.name} upload completed`);
        return;
      }

      const { chunkNum, exitPartList = [] } = task.taskRecord;
      const uploadedParts = new Set(exitPartList.map((p) => p.partNumber));
      let uploadedSize = exitPartList.reduce((sum, p) => sum + p.size, 0);
      const startTime = Date.now();

      // Track active chunks
      const activeChunks: Promise<void>[] = [];
      const controller = new AbortController();
      activeUploads.set(uid, { controller, queue: activeChunks });

      // Upload chunks with concurrency control
      for (let partNumber = 1; partNumber <= chunkNum; partNumber++) {
        // Skip already uploaded chunks
        if (uploadedParts.has(partNumber)) {
          continue;
        }

        // Wait if too many concurrent uploads
        while (activeChunks.length >= maxConcurrent) {
          await Promise.race(activeChunks);
          activeChunks.splice(
            activeChunks.findIndex((p) => p === Promise.resolve()),
            1
          );
        }

        // Check if paused
        const currentFile = fileList.find((f) => f.uid === uid);
        if (currentFile?.status === 'paused') {
          break;
        }

        const uploadPromise = (async () => {
          try {
            await uploadChunkWithRetry(file, identifier, partNumber, chunkSize);
            
            const chunkEndSize = Math.min(partNumber * chunkSize, file.size);
            uploadedSize = chunkEndSize;
            
            const progress = Math.floor((uploadedSize / file.size) * 100);
            const speed = calculateSpeed(uploadedSize, startTime);

            updateFile(uid, {
              progress,
              speed,
              uploadedSize,
            });
          } catch (error) {
            throw new Error(`Chunk ${partNumber} failed: ${error}`);
          }
        })();

        activeChunks.push(uploadPromise);
      }

      // Wait for all chunks
      await Promise.all(activeChunks);
      activeUploads.delete(uid);

      // Merge chunks
      const mergeResult = await mergeChunks(identifier);
      if (mergeResult.code === 200) {
        updateFile(uid, {
          status: 'success',
          progress: 100,
          url: mergeResult.data?.accessUrl || '',
          fileId: mergeResult.data?.id || identifier,
        });
        toast.success(`${file.name} uploaded successfully`);
      } else {
        throw new Error(mergeResult.msg || 'Merge failed');
      }
    } catch (error) {
      activeUploads.delete(uid);
      throw error;
    }
  };

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      try {
        // Validate file size
        if (file.size > config.maxSize) {
          toast.error(`${file.name} exceeds max size`);
          return;
        }

        // Calculate MD5
        toast.info(`Calculating MD5 for ${file.name}...`);
        const identifier = await md5(file);

        // Check if already in list
        const existing = fileList.find((f) => f.identifier === identifier);
        if (existing) {
          if (existing.status === 'success') {
            toast.info(`${file.name} already uploaded`);
            return;
          }
          if (existing.status === 'uploading') {
            toast.info(`${file.name} is uploading`);
            return;
          }
        }

        // Create file item
        const uid = `${Date.now()}_${Math.random()}`;
        const newFile: UploadFileItem = {
          file,
          name: file.name,
          status: 'uploading',
          progress: 0,
          speed: '0',
          uid,
          fileSize: file.size,
          uploadedSize: 0,
          startTime: Date.now(),
          identifier,
          retries: 0,
          fileId: null,
          url: null,
          paused: false,
        };

        setFileList((prev) => [...prev, newFile]);

        // Small file: direct upload
        if (file.size <= SMALL_FILE_THRESHOLD) {
          updateFile(uid, { progress: 10 });
          const result = await uploadFile(file);

          if (result.code === 200) {
            updateFile(uid, {
              status: 'success',
              progress: 100,
              url: result.data?.accessUrl || '',
              fileId: result.data?.id || '',
            });
            toast.success(`${file.name} uploaded`);
          } else {
            throw new Error(result.msg || 'Upload failed');
          }
        } else {
          // Large file: chunked upload
          await handleChunkedUpload(file, uid, identifier);
        }
      } catch (error) {
        const foundFile = fileList.find((f) => f.file === file);
        if (foundFile && foundFile.retries < MAX_RETRIES) {
          updateFile(foundFile.uid, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
        } else if (foundFile) {
          updateFile(foundFile.uid, {
            status: 'error',
            error: 'Max retries exceeded',
          });
          toast.error(`${foundFile.name} upload failed`);
        }
      }
    },
    [config, fileList, updateFile, calculateSpeed]
  );

  // Pause upload
  const pauseUpload = useCallback((uid: string) => {
    const upload = activeUploads.get(uid);
    if (upload) {
      upload.controller.abort();
      activeUploads.delete(uid);
    }
    updateFile(uid, { status: 'paused' });
  }, [updateFile]);

  // Resume upload
  const resumeUpload = useCallback(
    (uid: string) => {
      const file = fileList.find((f) => f.uid === uid);
      if (file && file.status === 'paused') {
        updateFile(uid, { status: 'uploading', startTime: Date.now() });
        handleUpload(file.file);
      }
    },
    [fileList, updateFile, handleUpload]
  );

  // Remove file
  const removeFile = useCallback((uid: string) => {
    const upload = activeUploads.get(uid);
    if (upload) {
      upload.controller.abort();
      activeUploads.delete(uid);
    }
    setFileList((prev) => prev.filter((f) => f.uid !== uid));
  }, []);

  // Retry failed files
  const retryFailed = useCallback(() => {
    const failed = fileList.filter((f) => f.status === 'failed' && f.retries < MAX_RETRIES);
    failed.forEach((file) => {
      updateFile(file.uid, {
        status: 'uploading',
        retries: file.retries + 1,
        startTime: Date.now(),
      });
      handleUpload(file.file);
    });
  }, [fileList, updateFile, handleUpload]);

  // Auto-retry failed uploads every 30s
  useEffect(() => {
    retryTimerRef.current = window.setInterval(() => {
      const hasFailed = fileList.some((f) => f.status === 'failed');
      if (hasFailed) {
        retryFailed();
      }
    }, 30000);

    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
      }
    };
  }, [fileList, retryFailed]);

  // Clear completed
  const clearCompleted = useCallback(() => {
    setFileList((prev) => prev.filter((f) => f.status !== 'success'));
  }, []);

  return {
    fileList,
    handleUpload,
    pauseUpload,
    resumeUpload,
    removeFile,
    retryFailed,
    clearCompleted,
  };
}

