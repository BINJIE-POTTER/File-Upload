import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for upload tasks
const uploadTasks = new Map();

// Ensure upload directories exist
const TEMP_DIR = path.join(__dirname, 'temp');
const STORAGE_DIR = path.join(__dirname, 'storage');
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(STORAGE_DIR);

// Configure multer for chunk uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadId = req.body.uploadId || req.query.uploadId;
    const chunkDir = path.join(TEMP_DIR, uploadId);
    fs.ensureDirSync(chunkDir);
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const partNumber = req.body.partNumber || req.query.partNumber;
    cb(null, `chunk_${partNumber}`);
  },
});

const upload = multer({ storage });

/**
 * Check if file exists by MD5 identifier
 */
app.get('/api/upload/check', async (req, res) => {
  try {
    const { identifier } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ code: 400, msg: 'Identifier is required' });
    }

    // Check if file already exists in storage
    const existingFile = path.join(STORAGE_DIR, `${identifier}.file`);
    if (await fs.pathExists(existingFile)) {
      const stats = await fs.stat(existingFile);
      return res.json({
        code: 200,
        data: {
          exists: true,
          path: `/storage/${identifier}.file`,
          size: stats.size,
        },
      });
    }

    res.json({ code: 200, data: { exists: false } });
  } catch (error) {
    console.error('Check file error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Get upload progress
 */
app.get('/api/upload/progress', async (req, res) => {
  try {
    const { identifier } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ code: 400, msg: 'Identifier is required' });
    }

    const task = uploadTasks.get(identifier);
    
    if (!task) {
      return res.json({ code: 200, data: null });
    }

    // Check which chunks are already uploaded
    const chunkDir = path.join(TEMP_DIR, identifier);
    const existingChunks = [];
    
    if (await fs.pathExists(chunkDir)) {
      const files = await fs.readdir(chunkDir);
      for (const file of files) {
        const match = file.match(/chunk_(\d+)/);
        if (match) {
          const partNumber = parseInt(match[1]);
          const stats = await fs.stat(path.join(chunkDir, file));
          existingChunks.push({ partNumber, size: stats.size });
        }
      }
    }

    res.json({
      code: 200,
      data: {
        finished: false,
        taskRecord: {
          ...task,
          exitPartList: existingChunks,
        },
      },
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Create multipart upload task
 */
app.post('/api/upload/multipart', async (req, res) => {
  try {
    const { identifier, fileName, totalSize, chunkSize, contentType } = req.body;

    if (!identifier || !fileName || !totalSize || !chunkSize) {
      return res.status(400).json({ code: 400, msg: 'Missing required parameters' });
    }

    // Check if already exists
    const existingFile = path.join(STORAGE_DIR, `${identifier}.file`);
    if (await fs.pathExists(existingFile)) {
      const stats = await fs.stat(existingFile);
      return res.json({
        code: 200,
        data: {
          finished: true,
          path: `/storage/${identifier}.file`,
          taskRecord: {
            fileIdentifier: identifier,
            id: identifier,
            fileName,
            totalSize: stats.size,
            chunkSize,
            chunkNum: Math.ceil(totalSize / chunkSize),
            exitPartList: [],
          },
        },
      });
    }

    const chunkNum = Math.ceil(totalSize / chunkSize);
    const task = {
      fileIdentifier: identifier,
      id: identifier,
      fileName,
      totalSize,
      chunkSize,
      chunkNum,
      contentType,
      createdAt: new Date(),
    };

    uploadTasks.set(identifier, task);

    // Create temp directory for chunks
    const chunkDir = path.join(TEMP_DIR, identifier);
    await fs.ensureDir(chunkDir);

    res.json({
      code: 200,
      data: {
        finished: false,
        taskRecord: {
          ...task,
          exitPartList: [],
        },
      },
    });
  } catch (error) {
    console.error('Create multipart upload error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Upload single chunk
 */
app.post('/api/upload/part', upload.single('file'), async (req, res) => {
  try {
    const { uploadId, partNumber } = req.body;

    if (!uploadId || !partNumber || !req.file) {
      return res.status(400).json({ code: 400, msg: 'Missing required parameters' });
    }

    res.json({
      code: 200,
      data: {
        partNumber: parseInt(partNumber),
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload part error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Upload small file directly
 */
app.post('/api/upload/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, msg: 'No file uploaded' });
    }

    // Generate a unique identifier for the file (in production, calculate MD5)
    const identifier = `${Date.now()}_${req.file.originalname}`;
    const targetPath = path.join(STORAGE_DIR, `${identifier}.file`);

    // Move file to storage
    await fs.move(req.file.path, targetPath, { overwrite: true });

    res.json({
      code: 200,
      data: {
        id: identifier,
        accessUrl: `/storage/${identifier}.file`,
        fileName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Merge uploaded chunks
 */
app.post('/api/upload/merge', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ code: 400, msg: 'Identifier is required' });
    }

    const task = uploadTasks.get(identifier);
    if (!task) {
      return res.status(404).json({ code: 404, msg: 'Upload task not found' });
    }

    const chunkDir = path.join(TEMP_DIR, identifier);
    const targetPath = path.join(STORAGE_DIR, `${identifier}.file`);

    // Check if all chunks exist
    const chunkFiles = [];
    for (let i = 1; i <= task.chunkNum; i++) {
      const chunkPath = path.join(chunkDir, `chunk_${i}`);
      if (!(await fs.pathExists(chunkPath))) {
        return res.status(400).json({
          code: 400,
          msg: `Missing chunk ${i}`,
        });
      }
      chunkFiles.push(chunkPath);
    }

    // Merge chunks
    const writeStream = fs.createWriteStream(targetPath);
    
    for (const chunkPath of chunkFiles) {
      const data = await fs.readFile(chunkPath);
      writeStream.write(data);
    }

    writeStream.end();

    // Wait for write to complete
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Clean up chunks
    await fs.remove(chunkDir);
    uploadTasks.delete(identifier);

    res.json({
      code: 200,
      data: {
        id: identifier,
        accessUrl: `/storage/${identifier}.file`,
        fileName: task.fileName,
        size: task.totalSize,
      },
    });
  } catch (error) {
    console.error('Merge chunks error:', error);
    res.status(500).json({ code: 500, msg: error.message });
  }
});

/**
 * Serve uploaded files
 */
app.use('/storage', express.static(STORAGE_DIR));

app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`);
  console.log(`Storage directory: ${STORAGE_DIR}`);
  console.log(`Temp directory: ${TEMP_DIR}`);
});

