import type { GenerateUnifiedRequest, GenerateDiaryResponse } from 'shared/types/diary';
import type { DiaryListResponse } from 'shared/types/api';
import { authFetch } from './auth';

export async function generateDiaryUnified(req: GenerateUnifiedRequest): Promise<GenerateDiaryResponse> {
  const res = await authFetch('/api/diary/generate-unified', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate diary: ${res.status}`);
  }
  return res.json();
}

export async function listDiaries(): Promise<DiaryListResponse> {
  const res = await authFetch('/api/diary/list');
  if (!res.ok) {
    throw new Error(`Failed to list diaries: ${res.status}`);
  }
  return res.json();
}

export async function getDiary(date: string): Promise<GenerateDiaryResponse> {
  const res = await authFetch(`/api/diary/${date}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('NOT_FOUND');
    }
    throw new Error(`Failed to get diary: ${res.status}`);
  }
  return res.json();
}

export async function uploadPhotos(
  files: File[],
  labels: string[],
  times: string[],
  date: string,
): Promise<{ url: string; label: string; time: string }[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  labels.forEach((label) => formData.append('labels', label));
  times.forEach((time) => formData.append('times', time));
  formData.append('date', date);

  const res = await authFetch('/api/photos/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload photos: ${res.status}`);
  }
  const data = await res.json();
  return data.photos;
}
