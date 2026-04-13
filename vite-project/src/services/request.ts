import type { BaseResponse } from "./types/type";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

/**
 * 处理响应
 * @param response 响应
 * @returns 响应数据
 */
const handleResponse = async <T>(response: Response): Promise<BaseResponse<T>> => {
  if (!response.ok) {
    throw new RequestError(response.status, `Request failed: ${response.status}`);
  }
  return response.json();
};

/**
 * 发送POST JSON请求
 * @param path 请求路径
 * @param body 请求体
 * @param signal 取消请求信号
 * @returns 响应数据
 */
export const postJSON = async <B extends object, T>(
  path: string,
  body: B,
  signal?: AbortSignal,
): Promise<BaseResponse<T>> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return handleResponse<T>(response);
};

/**
 * 发送POST FormData请求
 * @param path 请求路径
 * @param formData 请求体
 * @param signal 取消请求信号
 * @returns 响应数据
 */
export const postFormData = async <T>(
  path: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<BaseResponse<T>> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    signal,
  });
  return handleResponse<T>(response);
};
