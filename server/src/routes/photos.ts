import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import type { ApiError } from '../../../shared/src/types/api';
import { authenticate, requireRole } from '../middleware/auth';
import { savePhoto, getPhotos } from '../db';

const uploadDir = join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
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

export const photosRouter = Router();

// Upload photos (teacher only)
photosRouter.post('/upload', authenticate, requireRole('teacher'), upload.array('photos', 20), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      const error: ApiError = { error: 'No files uploaded', code: 400 };
      res.status(400).json(error);
      return;
    }

    const date = req.body.date || new Date().toISOString().split('T')[0];
    const labels = (req.body.labels as string[] | string) || [];
    const times = (req.body.times as string[] | string) || [];
    const labelArr = Array.isArray(labels) ? labels : [labels];
    const timeArr = Array.isArray(times) ? times : [times];

    const photos = files.map((file, i) => {
      const url = `/uploads/${file.filename}`;
      const timestamp = timeArr[i] || '';

      // Save to DB
      savePhoto(req.user!.id, date, file.filename, file.originalname, timestamp || null, url);

      return { url, label: labelArr[i] || '', time: timestamp };
    });

    res.json({ photos });
  } catch (err) {
    const error: ApiError = {
      error: 'Upload failed',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

// Get photos for a date (teacher only)
photosRouter.get('/:date', authenticate, requireRole('teacher'), (req, res) => {
  const photos = getPhotos(req.user!.id, req.params.date);
  res.json({ photos });
});
