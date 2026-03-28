import { readFileSync } from 'fs';
import { join } from 'path';
import type { Diary, ScheduleEntry, GpsPoint } from '../../../shared/src/types/diary';
import { generatePageText } from './llm';

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
        childName,
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
