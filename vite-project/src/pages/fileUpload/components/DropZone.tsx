import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const DropZone = ({ onFilesSelected }: DropZoneProps) => {
  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFilesSelected(accepted);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 
        transition-colors cursor-pointer
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
      `}
      role="button"
      tabIndex={0}
      aria-label="拖拽文件到此处或点击选择文件"
    >
      <input {...getInputProps()} />
      <Upload className="size-10 text-muted-foreground" />
      {isDragActive ? (
        <p className="text-sm text-primary font-medium">释放文件到此处</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground font-medium">
            拖拽文件到此处，或点击选择文件
          </p>
          <p className="text-xs text-muted-foreground/60">支持同时上传多个文件</p>
        </>
      )}
    </div>
  );
};
