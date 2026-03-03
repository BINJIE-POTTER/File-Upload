# File Upload Backend

Node.js backend for chunked file uploads and Dify AI chat proxy.

## Installation

```bash
npm install
```

## Configuration

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required for AI chat:

- **DIFY_API_KEY**: API key from your Dify app. Get it from [cloud.dify.ai](https://cloud.dify.ai) → Your App → Develop → API Access.

Optional:

- **DIFY_BASE_URL**: Dify API base (default: `https://api.dify.ai/v1`)
- **PORT**: Server port (default: 3001)

## Running

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Dify Chat (AI Resume)

- `POST /api/dify/chat` - Proxy to Dify chat-messages API (streaming)
  - Body: `{ query: string, conversation_id?: string, inputs?: object }`
  - Returns: `text/event-stream` with Dify SSE events

### File Upload (placeholder)

- `GET /api/upload/check?identifier=<md5>` - Check if file exists
- `GET /api/upload/progress?identifier=<md5>` - Get upload progress
- `POST /api/upload/multipart` - Create multipart upload task
- `POST /api/upload/part` - Upload single chunk
- `POST /api/upload/file` - Upload small file directly
- `POST /api/upload/merge` - Merge uploaded chunks

## Storage

- Uploaded files: `./storage/`
- Temporary chunks: `./temp/`

