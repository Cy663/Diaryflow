import type { GpsInputPoint, StayCluster, GpsPoint } from '../../../shared/src/types/diary';

export function haversineMeters(
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

function centroid(points: GpsInputPoint[]): { lat: number; lng: number } {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

/**
 * DBSCAN spatial clustering.
 * Returns an array of clusters (each cluster is an array of point indices).
 * Noise points are not included in any cluster.
 */
function dbscan(
  points: GpsInputPoint[],
  epsM: number,
  minPts: number,
): number[][] {
  const n = points.length;
  const UNVISITED = -1;
  const NOISE = -2;
  const labels = new Array<number>(n).fill(UNVISITED);
  const clusters: number[][] = [];

  function regionQuery(idx: number): number[] {
    const neighbors: number[] = [];
    const p = points[idx];
    for (let i = 0; i < n; i++) {
      if (haversineMeters(p.lat, p.lng, points[i].lat, points[i].lng) <= epsM) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  let clusterId = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;

    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      labels[i] = NOISE;
      continue;
    }

    // Start a new cluster
    const cluster: number[] = [];
    clusters.push(cluster);
    labels[i] = clusterId;
    cluster.push(i);

    const queue = [...neighbors];
    let qi = 0;
    while (qi < queue.length) {
      const j = queue[qi++];
      if (labels[j] === NOISE) {
        labels[j] = clusterId;
        cluster.push(j);
        continue;
      }
      if (labels[j] !== UNVISITED) continue;

      labels[j] = clusterId;
      cluster.push(j);

      const jNeighbors = regionQuery(j);
      if (jNeighbors.length >= minPts) {
        for (const nb of jNeighbors) {
          if (labels[nb] === UNVISITED || labels[nb] === NOISE) {
            queue.push(nb);
          }
        }
      }
    }

    clusterId++;
  }

  return clusters;
}

export function clusterStays(
  points: GpsInputPoint[],
  radiusM = 50,
  minDurationMin = 5,
  minPts = 2,
): StayCluster[] {
  if (points.length === 0) return [];

  // 1. Sort points chronologically
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // 2. Run spatial DBSCAN (eps=radiusM, minPts)
  const spatialClusters = dbscan(sorted, radiusM, minPts);

  // 3. Annotate each spatial cluster with min/max timestamps and build intermediate objects
  interface AnnotatedCluster {
    centroid: { lat: number; lng: number };
    startTime: string;
    endTime: string;
    points: GpsInputPoint[];
  }

  let annotated: AnnotatedCluster[] = spatialClusters.map((indices) => {
    const clusterPoints = indices.map((i) => sorted[i]);
    const timestamps = clusterPoints.map((p) => new Date(p.timestamp).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    return {
      centroid: centroid(clusterPoints),
      startTime: new Date(minTs).toISOString(),
      endTime: new Date(maxTs).toISOString(),
      points: clusterPoints,
    };
  });

  // 4. Merge clusters that overlap geographically (centroids within eps) AND temporally close (gap < 15 min)
  const MERGE_GAP_MIN = 15;
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < annotated.length; i++) {
      for (let j = i + 1; j < annotated.length; j++) {
        const dist = haversineMeters(
          annotated[i].centroid.lat, annotated[i].centroid.lng,
          annotated[j].centroid.lat, annotated[j].centroid.lng,
        );
        if (dist > radiusM) continue;

        const endI = new Date(annotated[i].endTime).getTime();
        const startJ = new Date(annotated[j].startTime).getTime();
        const endJ = new Date(annotated[j].endTime).getTime();
        const startI = new Date(annotated[i].startTime).getTime();

        const gap = Math.min(
          Math.abs(startJ - endI),
          Math.abs(startI - endJ),
        ) / 60000;

        if (gap < MERGE_GAP_MIN) {
          // Merge j into i
          const mergedPoints = [...annotated[i].points, ...annotated[j].points];
          const timestamps = mergedPoints.map((p) => new Date(p.timestamp).getTime());
          annotated[i] = {
            centroid: centroid(mergedPoints),
            startTime: new Date(Math.min(...timestamps)).toISOString(),
            endTime: new Date(Math.max(...timestamps)).toISOString(),
            points: mergedPoints,
          };
          annotated.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // 5. Filter clusters with duration < minDurationMin
  const result: StayCluster[] = annotated
    .filter((c) => durationMinutes(c.startTime, c.endTime) >= minDurationMin)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((c) => ({
      centroid: c.centroid,
      startTime: c.startTime,
      endTime: c.endTime,
      points: c.points,
    }));

  return result;
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
