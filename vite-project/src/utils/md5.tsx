import SparkMD5 from 'spark-md5';

const DEFAULT_SIZE = 20 * 1024 * 1024;

export const md5 = (file: File, chunkSize: number = DEFAULT_SIZE): Promise<string> => {
    return new Promise((resolve, reject) => {
        const startMs = new Date().getTime();
        // Use slice with fallback for legacy browsers
        const blobSlice = (File.prototype as any).slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice;
        const chunks = Math.ceil(file.size / chunkSize);
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();
        let currentChunk = 0;

        fileReader.onload = function (e) {
            spark.append(e.target?.result as ArrayBuffer);
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                const hash = spark.end();
                console.log('文件md5计算结束，总耗时：', (new Date().getTime() - startMs) / 1000, 's');
                resolve(hash);
            }
        };

        fileReader.onerror = function () {
            reject(new Error('Failed to read file for MD5 calculation'));
        };

        function loadNext() {
            console.log('当前chunk: ', currentChunk, '总chunk数: ', chunks);
            const start = currentChunk * chunkSize;
            const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    });
};
