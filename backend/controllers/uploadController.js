import { AppError } from "../utils/AppError.js";
import { success } from "../utils/response.js";
import * as uploadService from "../services/uploadService.js";

export const check = async (req, res) => {
  const { md5, filename, fileSize, chunkSize, totalChunks } = req.body;
  if (!md5 || !filename) throw new AppError(400, "md5 and filename are required");
  if (!fileSize || !chunkSize || !totalChunks) throw new AppError(400, "fileSize, chunkSize, and totalChunks are required");

  const result = await uploadService.checkFile(md5, filename, fileSize, chunkSize, totalChunks);
  success(res, result);
};

export const uploadChunk = async (req, res) => {
  const { uploadId, chunkIndex } = req.body;
  if (!uploadId) throw new AppError(400, "uploadId is required");
  if (chunkIndex === undefined) throw new AppError(400, "chunkIndex is required");
  if (!req.file) throw new AppError(400, "chunkData file is required");

  const result = await uploadService.saveChunk(uploadId, Number(chunkIndex), req.file.buffer);
  success(res, result);
};

export const merge = async (req, res) => {
  const { uploadId, filename, totalChunks, md5 } = req.body;
  if (!uploadId || !filename || !totalChunks || !md5) {
    throw new AppError(400, "uploadId, filename, totalChunks, and md5 are required");
  }

  const result = await uploadService.mergeFile(uploadId, filename, totalChunks, md5);
  success(res, result);
};

export const terminate = async (req, res) => {
  const { uploadId } = req.body;
  if (!uploadId) throw new AppError(400, "uploadId is required");

  const result = await uploadService.terminateUpload(uploadId);
  success(res, result);
};
