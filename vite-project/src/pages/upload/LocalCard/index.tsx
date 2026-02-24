import { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadList } from '../UploadList';
import type { UploadFileConfig } from '@/service/type/upload';

interface LocalCardProps {
  setFileList: (files: File[]) => void;
}

export function LocalCard({ setFileList }: LocalCardProps) {
  const [config] = useState<UploadFileConfig>({
    maxSize: 1024 * 1024 * 500, // 500MB
    accept: ['*/*'], // Accept all files
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    maxConcurrent: 3,
  });

  const {
    fileList: uploadList,
    handleUpload,
    pauseUpload,
    resumeUpload,
    removeFile,
    retryFailed,
    clearCompleted,
  } = useFileUpload(config);

  const handleDrop = async (files: File[]) => {
    setFileList(files);
    for (const file of files) {
      await handleUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Local Upload</CardTitle>
          <CardDescription>
            Upload files to local storage. Files larger than 5MB will be sliced and uploaded in chunks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone
            accept={{ '*/*': [] }}
            maxFiles={10}
            maxSize={config.maxSize}
            onDrop={handleDrop}
            onError={console.error}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </CardContent>
      </Card>

      {uploadList.length > 0 && (
        <UploadList
          files={uploadList}
          onPause={pauseUpload}
          onResume={resumeUpload}
          onRemove={removeFile}
          onRetryAll={retryFailed}
          onClearCompleted={clearCompleted}
        />
      )}
    </div>
  );
}
