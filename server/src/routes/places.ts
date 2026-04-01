import { Router } from 'express';
import { fetchPlacePhoto } from '../services/google-places';

export const placesRouter = Router();

placesRouter.get('/photo/:photoRef', async (req, res) => {
  try {
    const photoRef = Buffer.from(req.params.photoRef, 'base64url').toString('utf-8');
    const { buffer, contentType } = await fetchPlacePhoto(photoRef);
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Photo proxy error:', err);
    res.status(404).json({ error: 'Photo not found' });
  }
});
