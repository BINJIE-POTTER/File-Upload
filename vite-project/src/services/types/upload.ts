/** 检查文件 MD5 请求参数 */
export interface CheckMd5Request {
    /** 文件MD5 */
    md5: string;
    /** 文件名 */
    filename: string;
    /** 文件大小 */
    fileSize: number;
    /** 分片大小 */
    chunkSize: number;
    /** 总分片数 */
    totalChunks: number;
}

/** 检查文件 MD5 响应参数 */
export interface CheckMd5Response {
    /** 文件是否已存在（秒传） */
    exists: boolean;
    /** 秒传时返回的文件访问 URL */
    url?: string;
    /** 上传 ID（断点续传时使用） */
    uploadId?: string;
    /** 已上传的分片索引集合 */
    uploadedChunks?: number[];
}

/** 上传分片请求参数 */
export interface UploadChunkRequest {
    /** 上传ID */
    uploadId: string;
    /** 分片索引 */
    chunkIndex: number;
    /** 分片数据 */
    chunkData: Blob;
    /** 分片MD5 */
    chunkMd5?: string;
}

/** 上传分片响应参数 */
export interface UploadChunkResponse {
    /** 是否上传成功 */
    success: boolean;
}

/** 合并分片请求参数 */
export interface MergeChunksRequest {
    /** 上传ID */
    uploadId: string;
    /** 文件名 */
    filename: string;
    /** 总分片数 */
    totalChunks: number;
    /** 文件MD5 */
    md5: string;
}

/** 合并分片响应参数 */
export interface MergeChunksResponse {
    /** 是否合并成功 */
    success: boolean;
    /** 文件访问URL */
    url?: string;

    fileId?: string;
}

/** 终止上传请求参数 */
export interface TerminateUploadRequest {
    /** 上传ID */
    uploadId: string;
}

/** 终止上传响应参数 */
export interface TerminateUploadResponse {
    /** 是否终止成功 */
    success: boolean;
}

/** 上传状态 */
export type UploadStatus =
    | "idle" // 空闲状态
    | "hashing" // 计算MD5中
    | "uploading" // 上传中
    | "merging" // 合并中
    | "success" // 成功
    | "error" // 错误
    | "paused" // 暂停

/** 单个分片信息 */
export interface ChunkInfo {
    /** 分片索引 */
    index: number;
    /** 分片开始位置 */
    start: number;
    /** 分片结束位置 */
    end: number;
    /** 分片 MD5 */
    md5: string;
    /** 是否已上传 */
    uploaded: boolean;
    /** 重试次数 */
    retries: number;
}

/** 完整的上传任务状态 */
export interface UploadTask {
    /** 文件 */
    file: File;
    /** 文件MD5 */
    md5: string;
    /** 上传ID */
    uploadId: string;
    /** 上传状态 */
    status: UploadStatus;
    /** 分片信息 */
    chunks: ChunkInfo[];
    /** 上传进度 */
    progress: number;
}
