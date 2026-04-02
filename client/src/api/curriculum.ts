import type { ScheduleEntry } from 'shared/types/diary';
import type { CurriculumResponse } from 'shared/types/api';
import { authFetch } from './auth';

export async function getCurriculum(): Promise<ScheduleEntry[]> {
  const res = await authFetch('/api/curriculum');
  if (!res.ok) {
    throw new Error(`Failed to load curriculum: ${res.status}`);
  }
  const data: CurriculumResponse = await res.json();
  return data.entries;
}

export async function saveCurriculumApi(entries: ScheduleEntry[]): Promise<void> {
  const res = await authFetch('/api/curriculum', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) {
    throw new Error(`Failed to save curriculum: ${res.status}`);
  }
}

export async function parseCurriculumImage(file: File): Promise<ScheduleEntry[]> {
  const formData = new FormData();
  formData.append('schedule', file);

  const res = await authFetch('/api/curriculum/parse', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Failed to parse schedule: ${res.status}`);
  }
  const data = await res.json();
  return data.entries;
}
