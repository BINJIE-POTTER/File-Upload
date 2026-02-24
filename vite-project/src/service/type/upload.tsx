export type FileStatus = 'pending' | 'uploading' | 'paused' | 'success' | 'failed' | 'error';

export interface UploadFileItem {
  file: File;
  name: string;
  status: FileStatus;
  progress: number;
  speed: string;
  uid: string;
  fileSize: number;
  uploadedSize: number;
  startTime: number;
  identifier: string;
  retries: number;
  fileId: string | null;
  url: string | null;
  paused: boolean;
  error?: string;
}

export interface UploadFileConfig {
  maxSize: number;
  accept: string[];
  chunkSize?: number;
  maxConcurrent?: number;
}
