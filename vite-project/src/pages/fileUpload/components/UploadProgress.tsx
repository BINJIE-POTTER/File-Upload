import { File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UploadState } from "../hooks/useFileUpload";
import type { UploadStatus } from "@/services/types/upload";

/** 按钮变体 */
type ButtonVariant = "default" | "secondary" | "destructive" | "outline";

/** 上传状态配置 */
const STATUS_CONFIG: Record<UploadStatus, { label: string; variant: ButtonVariant }> = {
  idle: { label: "等待上传", variant: "outline" },
  hashing: { label: "计算 MD5", variant: "secondary" },
  uploading: { label: "上传中", variant: "default" },
  merging: { label: "合并中", variant: "secondary" },
  success: { label: "上传成功", variant: "default" },
  error: { label: "上传失败", variant: "destructive" },
  paused: { label: "已暂停", variant: "outline" },
};

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

interface UploadProgressProps {
  state: UploadState;
  onCancel: () => void;
  onRemove: () => void;
}

export const UploadProgress = ({ 
  state, 
  onCancel,
  onRemove,
}: UploadProgressProps) => {
  const { file, status, hashProgress, uploadProgress, errorMessage } = state;

  const config = STATUS_CONFIG[status];
  const isActive = status === "hashing" || status === "uploading" || status === "merging";
  const displayProgress = status === "hashing" ? hashProgress : uploadProgress;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {status === "success" ? (
              <CheckCircle className="size-5 text-green-600" />
            ) : status === "error" ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : (
              <File className="size-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>

          <Badge variant={config.variant}>
            {isActive && <Loader2 className="animate-spin" />}
            {config.label}
          </Badge>

          {isActive ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
              aria-label="取消上传"
            >
              <X />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label="移除"
            >
              <X />
            </Button>
          )}
        </div>

        {isActive && (
          <div className="flex flex-col gap-1.5">
            <Progress value={displayProgress} />
            <p className="text-right text-xs text-muted-foreground">{displayProgress}%</p>
          </div>
        )}

        {status === "error" && errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
    </div>
  );
};
