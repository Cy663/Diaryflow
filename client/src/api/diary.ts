import type { GenerateDiaryRequest, GenerateDiaryResponse, GenerateFromPhotosRequest, GenerateFromGpsRequest, UploadedPhoto, ScheduleEntry } from 'shared/types/diary';

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

export async function uploadPhotos(
  files: File[],
  labels: string[],
  times: string[],
): Promise<UploadedPhoto[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  labels.forEach((label) => formData.append('labels', label));
  times.forEach((time) => formData.append('times', time));

  const res = await fetch('/api/photos/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload photos: ${res.status}`);
  }
  const data = await res.json();
  return data.photos;
}

export async function parseSchedule(file: File): Promise<ScheduleEntry[]> {
  const formData = new FormData();
  formData.append('schedule', file);

  const res = await fetch('/api/schedule/parse', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to parse schedule: ${res.status}`);
  }
  const data = await res.json();
  return data.entries;
}

export async function generateDiaryFromPhotos(req: GenerateFromPhotosRequest): Promise<GenerateDiaryResponse> {
  const res = await fetch('/api/diary/generate-from-photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate diary: ${res.status}`);
  }
  return res.json();
}

export async function generateDiaryFromGps(req: GenerateFromGpsRequest): Promise<GenerateDiaryResponse> {
  const res = await fetch('/api/diary/generate-from-gps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate diary from GPS: ${res.status}`);
  }
  return res.json();
}
