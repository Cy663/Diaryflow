import { Router } from 'express';
import type { ApiError } from '../../../shared/src/types/api';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getPresetLocations,
  createPresetLocation,
  updatePresetLocation,
  deletePresetLocation,
} from '../db';

export const presetLocationsRouter = Router();

// List all preset locations for teacher
presetLocationsRouter.get('/', authenticate, requireRole('teacher'), (req, res) => {
  const locations = getPresetLocations(req.user!.id);
  res.json({ locations });
});

// Create a preset location
presetLocationsRouter.post('/', authenticate, requireRole('teacher'), (req, res) => {
  try {
    const { name, lat, lng, radiusM } = req.body;
    if (!name || lat == null || lng == null) {
      const error: ApiError = { error: 'name, lat, and lng are required', code: 400 };
      res.status(400).json(error);
      return;
    }
    const location = createPresetLocation(req.user!.id, name, lat, lng, radiusM ?? 50);
    res.json({ location });
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to create preset location',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

// Update a preset location
presetLocationsRouter.put('/:id', authenticate, requireRole('teacher'), (req, res) => {
  try {
    const { name, lat, lng, radiusM } = req.body;
    if (!name || lat == null || lng == null) {
      const error: ApiError = { error: 'name, lat, and lng are required', code: 400 };
      res.status(400).json(error);
      return;
    }
    const location = updatePresetLocation(req.params.id, name, lat, lng, radiusM ?? 50);
    res.json({ location });
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to update preset location',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});

// Delete a preset location
presetLocationsRouter.delete('/:id', authenticate, requireRole('teacher'), (req, res) => {
  try {
    deletePresetLocation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    const error: ApiError = {
      error: 'Failed to delete preset location',
      code: 500,
      details: err instanceof Error ? err.message : String(err),
    };
    res.status(500).json(error);
  }
});
