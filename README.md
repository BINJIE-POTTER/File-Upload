# File Upload Project

Full-stack file upload system with chunked uploads, resume capability, and retry mechanism.

## Features

1. **File Slicing**: Files > 5MB are automatically sliced into 5MB chunks
2. **Multiple File Uploads**: Upload multiple files simultaneously
3. **Pause/Resume**: Pause and resume individual file uploads
4. **Retry Mechanism**: Automatic retry for failed uploads (max 3 attempts)
5. **MD5 Deduplication**: Skip uploading files that already exist
6. **Resume Uploads**: Continue interrupted uploads from where they left off

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router DOM

### Backend
- Node.js + Express
- Multer for file handling
- fs-extra for file operations

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### Frontend

```bash
cd vite-project
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Project Structure

```
├── backend/
│   ├── server.js          # Express server
│   ├── storage/           # Uploaded files
│   └── temp/              # Temporary chunks
│
├── vite-project/
│   └── src/
│       ├── components/
│       │   └── ui/        # shadcn/ui components
│       ├── hooks/
│       │   └── useFileUpload.ts    # Upload logic hook
│       ├── pages/
│       │   └── upload/
│       │       ├── LocalCard/      # Local upload UI
│       │       └── UploadList/     # Upload queue UI
│       ├── service/
│       │   ├── upload.tsx          # API service
│       │   └── type/
│       │       └── upload.tsx      # TypeScript types
│       └── utils/
│           └── md5.tsx             # MD5 calculation
```

## Usage

1. Start the backend server
2. Start the frontend dev server
3. Navigate to the Upload page
4. Select the "Local" tab
5. Drop files into the dropzone
6. Monitor upload progress in the queue

## API Endpoints

- `GET /api/upload/check` - Check if file exists
- `GET /api/upload/progress` - Get upload progress
- `POST /api/upload/multipart` - Create upload task
- `POST /api/upload/part` - Upload chunk
- `POST /api/upload/file` - Upload small file
- `POST /api/upload/merge` - Merge chunks

## Configuration

### Frontend (`useFileUpload` hook)
- `maxSize`: Maximum file size (default: 500MB)
- `chunkSize`: Chunk size for large files (default: 5MB)
- `maxConcurrent`: Max concurrent chunk uploads (default: 3)

### Backend (environment)
- `PORT`: Server port (default: 3001)
- Storage directories configured in `server.js`


