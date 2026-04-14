import type { PresetLocation } from 'shared/types/diary';
import { authFetch } from './auth';

export async function getPresetLocations(): Promise<PresetLocation[]> {
  const res = await authFetch('/api/preset-locations');
  if (!res.ok) throw new Error(`Failed to load preset locations: ${res.status}`);
  const data = await res.json();
  return data.locations;
}

export async function createPresetLocation(data: {
  name: string;
  lat: number;
  lng: number;
  radiusM?: number;
}): Promise<PresetLocation> {
  const res = await authFetch('/api/preset-locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create preset location: ${res.status}`);
  const json = await res.json();
  return json.location;
}

export async function updatePresetLocation(
  id: string,
  data: { name: string; lat: number; lng: number; radiusM?: number },
): Promise<PresetLocation> {
  const res = await authFetch(`/api/preset-locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update preset location: ${res.status}`);
  return res.json();
}

export async function deletePresetLocation(id: string): Promise<void> {
  const res = await authFetch(`/api/preset-locations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete preset location: ${res.status}`);
}
