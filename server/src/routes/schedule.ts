import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import type { ApiError } from '../../../shared/src/types/api';
import { parseScheduleImage } from '../services/llm';

const uploadDir = join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `schedule-${Date.now()}`;
    const ext = file.originalname.split('.').pop();
    cb(null, `${unique}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const scheduleRouter = Router();

scheduleRouter.post('/parse', upload.single('schedule'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      const error: ApiError = { error: 'No file uploaded', code: 400 };
      res.status(400).json(error);
      return;
    }

    const result = await parseScheduleImage(file.path);
    res.json(result);
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to parse schedule',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});
