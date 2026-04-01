import type { GpsInputPoint, StayCluster, GpsPoint } from '../../../shared/src/types/diary';

function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function durationMinutes(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

export function clusterStays(
  points: GpsInputPoint[],
  radiusM = 50,
  minDurationMin = 5,
): StayCluster[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const clusters: StayCluster[] = [];
  let current: GpsInputPoint[] = [sorted[0]];
  let centroidLat = sorted[0].lat;
  let centroidLng = sorted[0].lng;

  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i];
    const dist = haversineMeters(centroidLat, centroidLng, p.lat, p.lng);

    if (dist <= radiusM) {
      current.push(p);
      centroidLat = current.reduce((s, pt) => s + pt.lat, 0) / current.length;
      centroidLng = current.reduce((s, pt) => s + pt.lng, 0) / current.length;
    } else {
      // finalize previous cluster if long enough
      const dur = durationMinutes(current[0].timestamp, current[current.length - 1].timestamp);
      if (dur >= minDurationMin) {
        clusters.push({
          centroid: { lat: centroidLat, lng: centroidLng },
          startTime: current[0].timestamp,
          endTime: current[current.length - 1].timestamp,
          points: current,
        });
      }
      current = [p];
      centroidLat = p.lat;
      centroidLng = p.lng;
    }
  }

  // finalize last cluster
  const dur = durationMinutes(current[0].timestamp, current[current.length - 1].timestamp);
  if (dur >= minDurationMin) {
    clusters.push({
      centroid: { lat: centroidLat, lng: centroidLng },
      startTime: current[0].timestamp,
      endTime: current[current.length - 1].timestamp,
      points: current,
    });
  }

  return clusters;
}

export function buildGpsTrace(
  points: GpsInputPoint[],
  clusters: StayCluster[],
): GpsPoint[] {
  return points.map((p) => {
    const cluster = clusters.find((c) =>
      new Date(p.timestamp) >= new Date(c.startTime) &&
      new Date(p.timestamp) <= new Date(c.endTime) &&
      haversineMeters(p.lat, p.lng, c.centroid.lat, c.centroid.lng) <= 100,
    );
    return {
      timestamp: p.timestamp,
      lat: p.lat,
      lng: p.lng,
      label: cluster?.placeName || '',
    };
  });
}
