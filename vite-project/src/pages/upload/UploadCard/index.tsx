import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"
import { md5 } from "@/utils/md5";

const UPLOAD_TARGET_OPTIONS = [
    {
        label: 'Local',
        value: 'local',
    },
    {
        label: 'Server',
        value: 'server',
    },
]

export type UploadCardProps = {
    fileList: File[],
    setFileList: (files: File[]) => void,
}

export const UploadCard = (
    { fileList, setFileList }: UploadCardProps
) => { 
    
    const handleDrop = async (files: File[]) => {
        console.log(files);
        const md5Value = await md5(files[0]);
        console.log("md5Value", md5Value);
        setFileList(files);
    };

    const handleUploadTargetChange = (value: string) => {
        console.log("value", value);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Select defaultValue={UPLOAD_TARGET_OPTIONS[0].value} onValueChange={handleUploadTargetChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a target" />
                        </SelectTrigger>
                        <SelectContent>
                            {UPLOAD_TARGET_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardTitle>
                <CardDescription>Upload your files to the target</CardDescription>
                <CardContent>
                    <Dropzone
                        accept={{ 'image/*': [] }}
                        maxFiles={10}
                        maxSize={1024 * 1024 * 10}
                        minSize={1024}
                        onDrop={handleDrop}
                        onError={console.error}
                        src={fileList}
                    >
                        <DropzoneEmptyState />
                        <DropzoneContent/>
                    </Dropzone>
                </CardContent>
            </CardHeader>
        </Card>
    )
}