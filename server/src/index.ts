import dotenv from 'dotenv';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

// Find .env in server/ directory regardless of cwd
const candidates = [
  resolve(__dirname, '..', '.env'),
  join(process.cwd(), '.env'),
  join(process.cwd(), 'server', '.env'),
];
for (const envPath of candidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
import express from 'express';
import cors from 'cors';
import './db';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { diaryRouter } from './routes/diary';
import { photosRouter } from './routes/photos';
import { placesRouter } from './routes/places';
import { curriculumRouter } from './routes/curriculum';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/photos', photosRouter);
app.use('/api/places', placesRouter);
app.use('/api/curriculum', curriculumRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
