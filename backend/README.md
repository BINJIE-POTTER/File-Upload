# File Upload Backend

Node.js backend for handling chunked file uploads.

## Installation

```bash
npm install
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

- `GET /api/upload/check?identifier=<md5>` - Check if file exists
- `GET /api/upload/progress?identifier=<md5>` - Get upload progress
- `POST /api/upload/multipart` - Create multipart upload task
- `POST /api/upload/part` - Upload single chunk
- `POST /api/upload/file` - Upload small file directly
- `POST /api/upload/merge` - Merge uploaded chunks

## Storage

- Uploaded files: `./storage/`
- Temporary chunks: `./temp/`

