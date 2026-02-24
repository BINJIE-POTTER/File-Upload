import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, X, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadFileItem } from '@/service/type/upload';

interface UploadListProps {
  files: UploadFileItem[];
  onPause: (uid: string) => void;
  onResume: (uid: string) => void;
  onRemove: (uid: string) => void;
  onRetryAll: () => void;
  onClearCompleted: () => void;
}

export function UploadList({
  files,
  onPause,
  onResume,
  onRemove,
  onRetryAll,
  onClearCompleted,
}: UploadListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-green-600',
      error: 'text-red-600',
      failed: 'text-orange-600',
      uploading: 'text-blue-600',
      paused: 'text-yellow-600',
      pending: 'text-gray-600',
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status: string, retries: number) => {
    if (status === 'failed' && retries > 0) return `Failed (${retries}/${3})`;
    if (status === 'error') return 'Unable to upload';
    const texts: Record<string, string> = {
      success: 'Completed',
      uploading: 'Uploading',
      paused: 'Paused',
      pending: 'Pending',
      failed: 'Failed',
    };
    return texts[status] || 'Pending';
  };

  const sortedFiles = [...files].sort((a, b) => {
    const priority: Record<string, number> = {
      error: 0,
      failed: 1,
      uploading: 2,
      paused: 3,
      pending: 4,
      success: 5,
    };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  const hasFailed = files.some((f) => f.status === 'failed' || f.status === 'error');
  const hasCompleted = files.some((f) => f.status === 'success');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Queue ({files.length})</CardTitle>
            <CardDescription>
              Track your file uploads with real-time progress
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasFailed && (
              <Button variant="outline" size="sm" onClick={onRetryAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Failed
              </Button>
            )}
            {hasCompleted && (
              <Button variant="ghost" size="sm" onClick={onClearCompleted}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedFiles.map((file) => (
              <div
                key={file.uid}
                className={cn(
                  'p-4 border rounded-lg transition-colors',
                  file.status === 'error' && 'border-red-300 bg-red-50',
                  file.status === 'failed' && 'border-orange-300 bg-orange-50',
                  file.status === 'success' && 'border-green-300 bg-green-50'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>{formatFileSize(file.fileSize)}</span>
                      {file.status === 'uploading' && file.speed !== '0' && (
                        <span className="text-blue-600">{file.speed} MB/s</span>
                      )}
                      <span className={cn('font-medium', getStatusColor(file.status))}>
                        {getStatusText(file.status, file.retries)}
                      </span>
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {file.status === 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPause(file.uid)}
                        className="h-8 w-8 p-0"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'paused' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResume(file.uid)}
                        className="h-8 w-8 p-0"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(file.uid)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'paused') && (
                  <div className="space-y-1">
                    <Progress value={file.progress} className="h-2" />
                    <p className="text-xs text-gray-600 text-right">
                      {file.progress}% ({formatFileSize(file.uploadedSize)} / {formatFileSize(file.fileSize)})
                    </p>
                  </div>
                )}

                {file.status === 'success' && file.url && (
                  <a
                    href={`http://localhost:3001${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View uploaded file
                  </a>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

