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
import { healthRouter } from './routes/health';
import { diaryRouter } from './routes/diary';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/diary', diaryRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
