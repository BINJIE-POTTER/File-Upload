import { ScrollArea } from "@/components/ui/scroll-area";
import { DropZone } from "./components/DropZone";
import { UploadProgress } from "./components/UploadProgress";
import { useFileUpload } from "./hooks/useFileUpload";

const FileUploadPage = () => {
    const { tasks, handleUpload, handleCancel, handleRemove } = useFileUpload();

    return (
        <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 p-8">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">文件上传</h1>
            <p className="text-sm text-muted-foreground">支持大文件分片上传、断点续传与秒传</p>
        </div>

        <DropZone onFilesSelected={handleUpload} />

        {tasks.size > 0 && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
            <ScrollArea className="h-full">
                <div className="divide-y">
                {[...tasks.values()].map((task) => (
                    <div key={task.id} className="px-4 py-3">
                    <UploadProgress
                        state={task}
                        onCancel={() => handleCancel(task.id)}
                        onRemove={() => handleRemove(task.id)}
                    />
                    </div>
                ))}
                </div>
            </ScrollArea>
            </div>
        )}
        </div>
    );
};

export default FileUploadPage;
