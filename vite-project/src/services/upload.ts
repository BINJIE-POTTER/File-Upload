import { postJSON, postFormData } from "./request";
import type {
    CheckMd5Request,
    CheckMd5Response,
    MergeChunksRequest,
    MergeChunksResponse,
    TerminateUploadRequest,
    TerminateUploadResponse,
    UploadChunkRequest,
    UploadChunkResponse,
} from "./types/upload";

/**
 * 检查文件MD5
 * @param request 检查文件MD5请求参数
 * @param signal 取消请求信号
 * @returns 检查文件MD5响应参数
 */
export const checkMd5 = (request: CheckMd5Request, signal?: AbortSignal) =>
    postJSON<CheckMd5Request, CheckMd5Response>("/api/upload/check", request, signal);

/**
 * 上传分片
 * @param request 上传分片请求参数
 * @param signal 取消请求信号
 * @returns 上传分片响应参数
 */
export const uploadChunk = (request: UploadChunkRequest, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append("uploadId", request.uploadId);
    formData.append("chunkIndex", String(request.chunkIndex));
    formData.append("chunkData", request.chunkData);
    if (request.chunkMd5) formData.append("chunkMd5", request.chunkMd5);

    return postFormData<UploadChunkResponse>("/api/upload/chunk", formData, signal);
};

/**
 * 合并分片
 * @param request 合并分片请求参数
 * @param signal 取消请求信号
 * @returns 合并分片响应参数
 */
export const mergeChunks = (request: MergeChunksRequest, signal?: AbortSignal) =>
    postJSON<MergeChunksRequest, MergeChunksResponse>("/api/upload/merge", request, signal);

/**
 * 终止上传
 * @param request 终止上传请求参数
 * @param signal 取消请求信号
 * @returns 终止上传响应参数
 */
export const terminateUpload = (request: TerminateUploadRequest, signal?: AbortSignal) =>
    postJSON<TerminateUploadRequest, TerminateUploadResponse>("/api/upload/terminate", request, signal);
