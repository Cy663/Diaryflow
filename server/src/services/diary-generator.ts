import { readFileSync } from 'fs';
import { join } from 'path';
import type { Diary, ScheduleEntry, GpsPoint, UploadedPhoto, GpsInputPoint } from '../../../shared/src/types/diary';
import { generatePageText, generatePageTextFromPhoto } from './llm';
import { clusterStays, buildGpsTrace } from './gps-clustering';
import { enrichClustersWithPlaces } from './google-places';
import { getFallbackImage } from './image-fallback';

const uploadsDir = join(__dirname, '..', '..', 'uploads');

const dataDir = join(__dirname, '..', 'data');

interface ImageMapEntry {
  photo: string;
  illustration: string;
}

function loadJson<T>(filename: string): T {
  const raw = readFileSync(join(dataDir, filename), 'utf-8');
  return JSON.parse(raw) as T;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

export async function generateDiary(date: string, childName: string): Promise<Diary> {
  const schedule = loadJson<ScheduleEntry[]>('schedule.json');
  const gpsTrace = loadJson<GpsPoint[]>('gps-trace.json');
  const imageMap = loadJson<Record<string, ImageMapEntry>>('image-map.json');

  const pages = await Promise.all(
    schedule.map(async (entry, index) => {
      const startMin = timeToMinutes(entry.startTime);
      const endMin = timeToMinutes(entry.endTime);

      const matchedGps = gpsTrace.filter((point) => {
        const pointTime = new Date(point.timestamp);
        const pointMin = pointTime.getHours() * 60 + pointTime.getMinutes();
        return pointMin >= startMin && pointMin <= endMin;
      });

      const location = matchedGps.length > 0
        ? matchedGps[matchedGps.length - 1].label
        : entry.location;

      const images = imageMap[entry.imageKey] || { photo: '/images/school-bus.jpg', illustration: '/images/school-bus.svg' };
      const timeRange = formatTimeRange(entry.startTime, entry.endTime);

      const text = await generatePageText({
        activity: entry.activity,
        location,
        timeRange,
        pageNumber: index,
        totalPages: schedule.length,
      });

      return {
        pageNumber: index + 1,
        imageUrl: images.photo,
        illustrationUrl: images.illustration,
        text,
        timeRange,
        activity: entry.activity,
      };
    }),
  );

  return {
    childName,
    date,
    pages,
    gpsTrace,
  };
}

export async function generateDiaryFromPhotos(
  date: string,
  childName: string,
  photos: UploadedPhoto[],
  schedule?: ScheduleEntry[],
): Promise<Diary> {
  const gpsTrace = loadJson<GpsPoint[]>('create-gps-trace.json');

  const placeNames: string[] = [];

  const pages = await Promise.all(
    photos.map(async (photo, index) => {
      const filename = photo.url.split('/').pop() || '';
      const imagePath = join(uploadsDir, filename);

      const entry = schedule?.[index];
      const scheduleCtx = entry
        ? {
            activity: entry.activity,
            timeRange: formatTimeRange(entry.startTime, entry.endTime),
            location: entry.location,
          }
        : undefined;

      const result = await generatePageTextFromPhoto(imagePath, scheduleCtx);
      placeNames[index] = result.place;

      const timeRange = entry
        ? formatTimeRange(entry.startTime, entry.endTime)
        : (photo.time || '');

      return {
        pageNumber: index + 1,
        imageUrl: photo.url,
        illustrationUrl: '',
        text: result.text,
        timeRange,
        activity: result.activity,
      };
    }),
  );

  // Replace stop-N placeholder labels with LLM place names
  const updatedGps = gpsTrace.map((point) => {
    const match = point.label.match(/^stop-(\d+)$/);
    if (match) {
      const stopIndex = parseInt(match[1], 10) - 1;
      const place = placeNames[stopIndex];
      return { ...point, label: place || '' };
    }
    return point;
  });

  return {
    childName,
    date,
    pages,
    gpsTrace: updatedGps,
  };
}

function activityPrefix(placeTypes: string[]): string {
  const joined = placeTypes.join(' ').toLowerCase();
  if (/restaurant|food|cafe|bakery|meal/.test(joined)) return 'Lunch at';
  if (/school|university|education|library/.test(joined)) return 'Class at';
  if (/park|playground|amusement/.test(joined)) return 'Playing at';
  if (/transit|bus_station|train_station|subway/.test(joined)) return 'Transit at';
  return 'Visiting';
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function generateDiaryFromGps(
  date: string,
  childName: string,
  gpsPoints: GpsInputPoint[],
): Promise<Diary> {
  const clusters = clusterStays(gpsPoints);

  if (clusters.length === 0) {
    throw new Error('No significant stops detected in GPS data');
  }

  await enrichClustersWithPlaces(clusters);

  const pages = await Promise.all(
    clusters.map(async (cluster, index) => {
      const placeName = cluster.placeName || 'Unknown Place';
      const types = cluster.placeTypes || [];
      const prefix = activityPrefix(types);
      const activity = `${prefix} ${placeName}`;
      const startHHMM = isoToHHMM(cluster.startTime);
      const endHHMM = isoToHHMM(cluster.endTime);
      const timeRange = formatTimeRange(startHHMM, endHHMM);

      let imageUrl: string;
      if (cluster.photoRef) {
        const encoded = Buffer.from(cluster.photoRef).toString('base64url');
        imageUrl = `/api/places/photo/${encoded}`;
      } else {
        imageUrl = getFallbackImage(types);
      }

      const text = await generatePageText({
        activity: placeName,
        location: placeName,
        timeRange,
        pageNumber: index,
        totalPages: clusters.length,
      });

      return {
        pageNumber: index + 1,
        imageUrl,
        illustrationUrl: '',
        text,
        timeRange,
        activity,
      };
    }),
  );

  const gpsTrace = buildGpsTrace(gpsPoints, clusters);

  return {
    childName,
    date,
    pages,
    gpsTrace,
  };
}
