import { Router } from 'express';
import type { GenerateUnifiedRequest, GenerateDiaryResponse } from '../../../shared/src/types/diary';
import type { ApiError } from '../../../shared/src/types/api';
import { generateDiaryUnified } from '../services/diary-generator';
import { authenticate, requireRole } from '../middleware/auth';
import { saveDiary, getDiary, listDiaries, getPresetLocations } from '../db';

export const diaryRouter = Router();

// Generate diary (teacher only) — saves to DB
diaryRouter.post('/generate-unified', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { date, gpsPoints = [], photos = [], curriculum } = req.body as GenerateUnifiedRequest;

    if (!date) {
      const error: ApiError = { error: 'date is required', code: 400 };
      res.status(400).json(error);
      return;
    }

    if (gpsPoints.length === 0 && photos.length === 0) {
      const error: ApiError = { error: 'At least GPS data or photos must be provided', code: 400 };
      res.status(400).json(error);
      return;
    }

    const presetLocations = getPresetLocations(req.user!.id);
    const diary = await generateDiaryUnified(date, gpsPoints, photos, curriculum, presetLocations);

    // Persist diary
    saveDiary(req.user!.id, date, JSON.stringify(diary));

    const response: GenerateDiaryResponse = { diary };
    res.json(response);
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to generate diary',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

// List all diaries — teachers see own, students/families see teacher's
diaryRouter.get('/list', authenticate, (req, res) => {
  const teacherId = req.user!.role === 'teacher' ? req.user!.id : req.user!.teacherId;
  if (!teacherId) {
    res.status(400).json({ error: 'No teacher associated', code: 400 });
    return;
  }
  const diaries = listDiaries(teacherId);
  res.json({ diaries });
});

// Get diary by date — teachers see own, students/families see teacher's
diaryRouter.get('/:date', authenticate, (req, res) => {
  const teacherId = req.user!.role === 'teacher' ? req.user!.id : req.user!.teacherId;
  if (!teacherId) {
    res.status(400).json({ error: 'No teacher associated', code: 400 });
    return;
  }

  const diaryJson = getDiary(teacherId, req.params.date);
  if (!diaryJson) {
    res.status(404).json({ error: 'No diary found for this date', code: 404 });
    return;
  }

  res.json({ diary: JSON.parse(diaryJson) });
});
