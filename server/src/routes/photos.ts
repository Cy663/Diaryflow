import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import type { ApiError } from '../../../shared/src/types/api';

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const photosRouter = Router();

photosRouter.post('/upload', upload.array('photos', 20), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      const error: ApiError = { error: 'No files uploaded', code: 400 };
      res.status(400).json(error);
      return;
    }

    const labels = (req.body.labels as string[] | string) || [];
    const times = (req.body.times as string[] | string) || [];
    const labelArr = Array.isArray(labels) ? labels : [labels];
    const timeArr = Array.isArray(times) ? times : [times];

    const photos = files.map((file, i) => ({
      url: `/uploads/${file.filename}`,
      label: labelArr[i] || '',
      time: timeArr[i] || '',
    }));

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
