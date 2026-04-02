import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import type { ApiError } from '../../../shared/src/types/api';
import { authenticate, requireRole } from '../middleware/auth';
import { getCurriculum, saveCurriculum } from '../db';
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

export const curriculumRouter = Router();

// Get teacher's curriculum
curriculumRouter.get('/', authenticate, requireRole('teacher'), (req, res) => {
  const entries = getCurriculum(req.user!.id);
  res.json({ entries: entries || [] });
});

// Save/update curriculum
curriculumRouter.put('/', authenticate, requireRole('teacher'), (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      const error: ApiError = { error: 'entries must be an array', code: 400 };
      res.status(400).json(error);
      return;
    }
    saveCurriculum(req.user!.id, entries);
    res.json({ entries });
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to save curriculum',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

// Parse schedule image and save
curriculumRouter.post('/parse', authenticate, requireRole('teacher'), upload.single('schedule'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      const error: ApiError = { error: 'No file uploaded', code: 400 };
      res.status(400).json(error);
      return;
    }

    const result = await parseScheduleImage(file.path);
    saveCurriculum(req.user!.id, result.entries as any);
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
