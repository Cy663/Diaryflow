import { Router } from 'express';
import type { GenerateDiaryRequest, GenerateDiaryResponse } from '../../../shared/src/types/diary';
import type { ApiError } from '../../../shared/src/types/api';
import { generateDiary } from '../services/diary-generator';

export const diaryRouter = Router();

diaryRouter.post('/generate', async (req, res) => {
  try {
    const { date, childName = 'Alex' } = req.body as GenerateDiaryRequest;

    if (!date) {
      const error: ApiError = { error: 'date is required', code: 400 };
      res.status(400).json(error);
      return;
    }

    const diary = await generateDiary(date, childName);
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
