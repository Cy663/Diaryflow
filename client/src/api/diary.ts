import type { GenerateDiaryRequest, GenerateDiaryResponse } from 'shared/types/diary';

export async function generateDiary(req: GenerateDiaryRequest): Promise<GenerateDiaryResponse> {
  const res = await fetch('/api/diary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate diary: ${res.status}`);
  }
  return res.json();
}
