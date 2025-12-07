import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { useState } from 'react';
import { UploadIcon } from 'lucide-react';


const UploadPage = () => {
  const [files, setFiles] = useState<File[] | undefined>();
  
  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Upload Page</h1>
      <Dropzone
        accept={{ 'image/*': [] }}
        maxFiles={10}
        maxSize={1024 * 1024 * 10}
        minSize={1024}
        onDrop={handleDrop}
        onError={console.error}
        src={files}
      >
        <DropzoneEmptyState />
        <DropzoneContent>
          <ScrollArea className="w-full h-[300px] rounded-md">
            <div className="h-[300px] flex items-center space-x-4 p-4 justify-center">
              {files?.map((file, index) => (
                <div key={index} className="shrink-0">
                  <div className="h-[260px] aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="block mt-2 text-sm text-muted-foreground truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UploadIcon size={16} />
          </div>
          click to upload more
        </DropzoneContent>
      </Dropzone>
    </div>
  );
};


export default UploadPage;

