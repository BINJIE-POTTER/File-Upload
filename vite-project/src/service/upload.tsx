/**
 * Upload API service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  msg?: string;
}

export interface TaskRecord {
  fileIdentifier: string;
  id: string;
  fileName: string;
  totalSize: number;
  chunkSize: number;
  chunkNum: number;
  exitPartList?: Array<{ partNumber: number; size: number }>;
}

export interface TaskInfo {
  finished: boolean;
  path?: string;
  taskRecord: TaskRecord;
}

/**
 * Check if file exists by MD5
 */
export async function checkFileExists(identifier: string): Promise<ApiResponse<{ exists: boolean; path?: string; size?: number }>> {
  const response = await fetch(`${API_BASE_URL}/upload/check?identifier=${identifier}`);
  return response.json();
}

/**
 * Get upload progress
 */
export async function getUploadProgress(identifier: string): Promise<ApiResponse<TaskInfo | null>> {
  const response = await fetch(`${API_BASE_URL}/upload/progress?identifier=${identifier}`);
  return response.json();
}

/**
 * Create multipart upload task
 */
export async function createMultipartUpload(params: {
  identifier: string;
  fileName: string;
  totalSize: number;
  chunkSize: number;
  contentType: string;
}): Promise<ApiResponse<TaskInfo>> {
  const response = await fetch(`${API_BASE_URL}/upload/multipart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

/**
 * Upload single chunk
 */
export async function uploadChunk(params: {
  uploadId: string;
  partNumber: number;
  chunk: Blob;
}): Promise<ApiResponse<{ partNumber: number; size: number }>> {
  const formData = new FormData();
  formData.append('uploadId', params.uploadId);
  formData.append('partNumber', params.partNumber.toString());
  formData.append('file', params.chunk);

  const response = await fetch(`${API_BASE_URL}/upload/part`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

/**
 * Upload small file directly
 */
export async function uploadFile(file: File): Promise<ApiResponse<{ id: string; accessUrl: string; fileName: string; size: number }>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/file`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

/**
 * Merge uploaded chunks
 */
export async function mergeChunks(identifier: string): Promise<ApiResponse<{ id: string; accessUrl: string; fileName: string; size: number }>> {
  const response = await fetch(`${API_BASE_URL}/upload/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });
  return response.json();
}
