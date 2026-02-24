import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCard } from './UploadCard';
import { LocalCard } from './LocalCard';

export function UploadPage() {
  const [fileList, setFileList] = useState<File[]>([]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">File Upload</h1>
      
      <Tabs defaultValue="local" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="local">Local Upload</TabsTrigger>
          <TabsTrigger value="cloud">Cloud Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="local" className="mt-6">
          <LocalCard setFileList={setFileList} />
        </TabsContent>
        
        <TabsContent value="cloud" className="mt-6">
          <UploadCard fileList={fileList} setFileList={setFileList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UploadPage;

