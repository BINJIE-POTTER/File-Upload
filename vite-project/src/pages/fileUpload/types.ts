/** 主线程 → Worker 消息 */
export interface HashWorkerInput {
  /** 文件 */
  file: File;
  /** 分片大小 */
  chunkSize: number;
}

/** 单个分片哈希结果 */
export interface ChunkHash {
  /** 分片索引 */
  index: number;
  /** 分片开始位置 */
  start: number;
  /** 分片结束位置 */
  end: number;
  /** 分片 MD5 */
  md5: string;
}

/** Worker → 主线程：进度消息 */
export interface HashProgressMessage {
  /** 类型 */
  type: "progress";
  /** 当前分片 */
  current: number;
  /** 总分片数 */
  total: number;
}

/** Worker → 主线程：完成消息 */
export interface HashCompleteMessage {
  /** 类型 */
  type: "complete";
  /** 文件 MD5 */
  fileMd5: string;
  /** 分片信息 */
  chunks: ChunkHash[];
}

/** Worker → 主线程：错误消息 */
export interface HashErrorMessage {
  /** 类型 */
  type: "error";
  /** 错误消息 */
  message: string;
}

export type HashWorkerOutput =
  | HashProgressMessage
  | HashCompleteMessage
  | HashErrorMessage;

/** useFileHash 返回的哈希结果 */
export interface FileHashResult {
  /** 文件 MD5 */
  fileMd5: string;
  /** 分片信息 */
  chunks: ChunkHash[];
}
