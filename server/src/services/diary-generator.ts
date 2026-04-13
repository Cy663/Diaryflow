import { join } from 'path';
import type { Diary, ScheduleEntry, GpsInputPoint, PhotoWithTimestamp } from '../../../shared/src/types/diary';
import { generatePageText, generatePageTextFromPhoto } from './llm';
import { clusterStays, buildGpsTrace } from './gps-clustering';
import { enrichClustersWithPlaces } from './google-places';
import { getFallbackImage } from './image-fallback';

const uploadsDir = join(__dirname, '..', '..', 'uploads');

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function activityPrefix(placeTypes: string[]): string {
  const joined = placeTypes.join(' ').toLowerCase();
  if (/restaurant|food|cafe|bakery|meal/.test(joined)) return 'Lunch at';
  if (/school|university|education|library/.test(joined)) return 'Class at';
  if (/playground/.test(joined)) return 'Freeplay at';
  if (/park|amusement/.test(joined)) return 'Playing at';
  if (/transit|bus_station|train_station|subway/.test(joined)) return 'Transit at';
  return 'Visiting';
}

function findCurriculumForTimeRange(
  startHHMM: string,
  endHHMM: string,
  curriculum?: ScheduleEntry[],
): ScheduleEntry | undefined {
  if (!curriculum || curriculum.length === 0) return undefined;
  const startMin = timeToMinutes(startHHMM);
  const endMin = timeToMinutes(endHHMM);
  const midMin = (startMin + endMin) / 2;

  return curriculum.find((entry) => {
    const eStart = timeToMinutes(entry.startTime);
    const eEnd = timeToMinutes(entry.endTime);
    return midMin >= eStart && midMin <= eEnd;
  });
}

export async function generateDiaryUnified(
  date: string,
  gpsPoints: GpsInputPoint[],
  photos: PhotoWithTimestamp[],
  curriculum?: ScheduleEntry[],
): Promise<Diary> {
  const hasGps = gpsPoints.length > 0;
  const hasPhotos = photos.length > 0;

  // GPS + Photos (full unified flow)
  if (hasGps && hasPhotos) {
    return generateUnifiedGpsPhotos(date, gpsPoints, photos, curriculum);
  }

  // GPS only
  if (hasGps) {
    return generateFromGpsOnly(date, gpsPoints, curriculum);
  }

  // Photos only
  if (hasPhotos) {
    return generateFromPhotosOnly(date, photos, curriculum);
  }

  throw new Error('At least GPS data or photos must be provided');
}

const BUFFER_MINUTES = 5;

async function generateUnifiedGpsPhotos(
  date: string,
  gpsPoints: GpsInputPoint[],
  photos: PhotoWithTimestamp[],
  curriculum?: ScheduleEntry[],
): Promise<Diary> {
  const clusters = clusterStays(gpsPoints);
  if (clusters.length === 0) {
    throw new Error('No significant stops detected in GPS data');
  }

  await enrichClustersWithPlaces(clusters);

  // Match photos to clusters by TIME-OF-DAY only (ignoring date)
  const clusterPhotos: Map<number, PhotoWithTimestamp[]> = new Map();
  const usedPhotoIndices = new Set<number>();

  for (let pi = 0; pi < photos.length; pi++) {
    const photoMin = timeToMinutes(isoToHHMM(photos[pi].timestamp));
    let bestClusterIdx = -1;
    let bestDist = Infinity;

    for (let ci = 0; ci < clusters.length; ci++) {
      const clusterStartMin = timeToMinutes(isoToHHMM(clusters[ci].startTime)) - BUFFER_MINUTES;
      const clusterEndMin = timeToMinutes(isoToHHMM(clusters[ci].endTime)) + BUFFER_MINUTES;

      if (photoMin >= clusterStartMin && photoMin <= clusterEndMin) {
        const clusterMidMin = (timeToMinutes(isoToHHMM(clusters[ci].startTime)) + timeToMinutes(isoToHHMM(clusters[ci].endTime))) / 2;
        const dist = Math.abs(photoMin - clusterMidMin);
        if (dist < bestDist) {
          bestDist = dist;
          bestClusterIdx = ci;
        }
      }
    }

    if (bestClusterIdx >= 0) {
      const existing = clusterPhotos.get(bestClusterIdx) || [];
      existing.push(photos[pi]);
      clusterPhotos.set(bestClusterIdx, existing);
      usedPhotoIndices.add(pi);
    }
  }

  // Collect unmatched photos
  const unmatchedPhotos = photos.filter((_, i) => !usedPhotoIndices.has(i));

  // Assign unmatched photos to clusters that have no photo yet (round-robin)
  let unmatchedIdx = 0;
  for (let ci = 0; ci < clusters.length && unmatchedIdx < unmatchedPhotos.length; ci++) {
    if (!clusterPhotos.has(ci)) {
      clusterPhotos.set(ci, [unmatchedPhotos[unmatchedIdx]]);
      unmatchedIdx++;
    }
  }
  const remainingPhotos = unmatchedPhotos.slice(unmatchedIdx);

  // Generate pages from clusters
  const clusterPages = await Promise.all(
    clusters.map(async (cluster, index) => {
      const placeName = cluster.placeName || 'Unknown Place';
      const types = cluster.placeTypes || [];
      const prefix = activityPrefix(types);
      const activity = `${prefix} ${placeName}`;
      const startHHMM = isoToHHMM(cluster.startTime);
      const endHHMM = isoToHHMM(cluster.endTime);
      const timeRange = formatTimeRange(startHHMM, endHHMM);

      const matchedPhotos = clusterPhotos.get(index);
      const currEntry = findCurriculumForTimeRange(startHHMM, endHHMM, curriculum);
      const curriculumHint = currEntry
        ? `${currEntry.activity}${currEntry.location ? ` at ${currEntry.location}` : ''}`
        : undefined;

      let imageUrl: string;
      let placesImageUrl: string | undefined;
      let text: string;

      // Build Google Places image URL if available
      if (cluster.photoRef) {
        const encoded = Buffer.from(cluster.photoRef).toString('base64url');
        placesImageUrl = `/api/places/photo/${encoded}`;
      }

      if (matchedPhotos && matchedPhotos.length > 0) {
        // Uploaded photo is always primary
        imageUrl = matchedPhotos[0].url;

        const uploadedFilename = matchedPhotos[0].url.split('/').pop() || '';
        const uploadedPath = join(uploadsDir, uploadedFilename);

        // Generate text from uploaded photo (richer content)
        const result = await generatePageTextFromPhoto(uploadedPath, {
          activity: currEntry?.activity,
          timeRange,
          location: currEntry?.location || placeName,
        });
        text = result.text;
      } else if (placesImageUrl) {
        // No uploaded photo — Places photo becomes primary, no secondary
        imageUrl = placesImageUrl;
        placesImageUrl = undefined;
        text = await generatePageText({
          activity: currEntry?.activity || placeName,
          location: placeName,
          timeRange,
          pageNumber: index,
          totalPages: clusters.length,
          curriculumHint,
        });
      } else {
        // No photos at all — fallback image
        imageUrl = getFallbackImage(types);
        text = await generatePageText({
          activity: currEntry?.activity || placeName,
          location: placeName,
          timeRange,
          pageNumber: index,
          totalPages: clusters.length,
          curriculumHint,
        });
      }

      return {
        pageNumber: index + 1,
        imageUrl,
        placesImageUrl,
        illustrationUrl: '',
        text,
        timeRange,
        activity: currEntry?.activity || activity,
      };
    }),
  );

  // Append extra pages from remaining unmatched photos
  const extraPages = await Promise.all(
    remainingPhotos.map(async (photo, i) => {
      const filename = photo.url.split('/').pop() || '';
      const imagePath = join(uploadsDir, filename);
      const photoHHMM = isoToHHMM(photo.timestamp);

      const currEntry = curriculum?.find((entry) => {
        const eStart = timeToMinutes(entry.startTime);
        const eEnd = timeToMinutes(entry.endTime);
        return timeToMinutes(photoHHMM) >= eStart && timeToMinutes(photoHHMM) <= eEnd;
      });

      const result = await generatePageTextFromPhoto(imagePath, currEntry ? {
        activity: currEntry.activity,
        timeRange: formatTimeRange(currEntry.startTime, currEntry.endTime),
        location: currEntry.location,
      } : undefined);

      const timeRange = currEntry
        ? formatTimeRange(currEntry.startTime, currEntry.endTime)
        : photoHHMM;

      return {
        pageNumber: clusterPages.length + i + 1,
        imageUrl: photo.url,
        illustrationUrl: '',
        text: result.text,
        timeRange,
        activity: currEntry?.activity || result.activity,
      };
    }),
  );

  const allPages = [...clusterPages, ...extraPages];

  const gpsTrace = buildGpsTrace(gpsPoints, clusters);

  return { date, pages: allPages, gpsTrace };
}

async function generateFromGpsOnly(
  date: string,
  gpsPoints: GpsInputPoint[],
  curriculum?: ScheduleEntry[],
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

      const currEntry = findCurriculumForTimeRange(startHHMM, endHHMM, curriculum);
      const curriculumHint = currEntry
        ? `${currEntry.activity}${currEntry.location ? ` at ${currEntry.location}` : ''}`
        : undefined;

      const text = await generatePageText({
        activity: currEntry?.activity || placeName,
        location: placeName,
        timeRange,
        pageNumber: index,
        totalPages: clusters.length,
        curriculumHint,
      });

      return {
        pageNumber: index + 1,
        imageUrl,
        illustrationUrl: '',
        text,
        timeRange,
        activity: currEntry?.activity || activity,
      };
    }),
  );

  const gpsTrace = buildGpsTrace(gpsPoints, clusters);

  return { date, pages, gpsTrace };
}

async function generateFromPhotosOnly(
  date: string,
  photos: PhotoWithTimestamp[],
  curriculum?: ScheduleEntry[],
): Promise<Diary> {
  // Sort photos by timestamp
  const sorted = [...photos].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const pages = await Promise.all(
    sorted.map(async (photo, index) => {
      const filename = photo.url.split('/').pop() || '';
      const imagePath = join(uploadsDir, filename);
      const photoHHMM = isoToHHMM(photo.timestamp);

      // Find matching curriculum entry
      const currEntry = curriculum?.find((entry) => {
        const eStart = timeToMinutes(entry.startTime);
        const eEnd = timeToMinutes(entry.endTime);
        const photoMin = timeToMinutes(photoHHMM);
        return photoMin >= eStart && photoMin <= eEnd;
      });

      const scheduleCtx = currEntry
        ? {
            activity: currEntry.activity,
            timeRange: formatTimeRange(currEntry.startTime, currEntry.endTime),
            location: currEntry.location,
          }
        : undefined;

      const result = await generatePageTextFromPhoto(imagePath, scheduleCtx);

      const timeRange = currEntry
        ? formatTimeRange(currEntry.startTime, currEntry.endTime)
        : photoHHMM;

      return {
        pageNumber: index + 1,
        imageUrl: photo.url,
        illustrationUrl: '',
        text: result.text,
        timeRange,
        activity: currEntry?.activity || result.activity,
      };
    }),
  );

  return { date, pages, gpsTrace: [] };
}
