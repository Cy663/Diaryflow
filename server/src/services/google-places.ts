import type { StayCluster } from '../../../shared/src/types/diary';

const MAPS_API_BASE = 'https://maps.googleapis.com/maps/api/place';

interface PlaceResult {
  displayName: string;
  types: string[];
  photoRef: string | null;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY not set');
  return key;
}

export async function queryPlaceForCluster(
  cluster: StayCluster,
): Promise<PlaceResult> {
  const apiKey = getApiKey();
  const { lat, lng } = cluster.centroid;

  const url = `${MAPS_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=50&key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Places API returned ${res.status}`);
  }

  const data = await res.json() as { results?: Array<{ name?: string; types?: string[]; photos?: Array<{ photo_reference?: string }> }> };
  const results = data.results || [];

  // Rank results: prefer meaningful places (school, park, restaurant, library)
  // over generic POIs (ATMs, insurance), over routes/localities
  // High-value types for a child's diary context
  const TOP_TYPES = [
    'school', 'secondary_school', 'primary_school', 'university',
    'library', 'park', 'playground', 'swimming_pool', 'museum',
  ];
  const GOOD_TYPES = [
    'restaurant', 'cafe', 'food', 'meal_takeaway',
    'community_center', 'gym', 'shopping_mall',
  ];
  const SKIP_TYPES = ['route', 'locality', 'political', 'neighborhood', 'sublocality'];

  function placeScore(r: { types?: string[]; photos?: unknown[] }): number {
    const types = r.types || [];
    if (types.some(t => SKIP_TYPES.includes(t)) && types.length <= 2) return -1;
    if (types.some(t => TOP_TYPES.includes(t))) return 3;
    if (types.some(t => GOOD_TYPES.includes(t))) return 2;
    if (types.includes('point_of_interest') || types.includes('establishment')) return 1;
    return 0;
  }

  const ranked = [...results].sort((a, b) => {
    const diff = placeScore(b) - placeScore(a);
    if (diff !== 0) return diff;
    // Tie-break: prefer places with photos
    return (b.photos?.length || 0) - (a.photos?.length || 0);
  });
  const poi = ranked[0];

  if (!poi) {
    return { displayName: 'Location', types: [], photoRef: null };
  }

  const photoRef = poi.photos?.[0]?.photo_reference || null;

  return {
    displayName: poi.name || 'Unknown Place',
    types: poi.types || [],
    photoRef,
  };
}

export async function enrichClustersWithPlaces(
  clusters: StayCluster[],
): Promise<void> {
  for (const cluster of clusters) {
    try {
      const result = await queryPlaceForCluster(cluster);
      cluster.placeName = result.displayName;
      cluster.placeTypes = result.types;
      cluster.photoRef = result.photoRef ?? undefined;
    } catch (err) {
      console.error('Places API error for cluster:', err);
      cluster.placeName = `Location at ${cluster.centroid.lat.toFixed(4)},${cluster.centroid.lng.toFixed(4)}`;
      cluster.placeTypes = [];
      cluster.photoRef = undefined;
    }
  }
}

export async function fetchPlacePhoto(
  photoRef: string,
  maxWidthPx = 800,
): Promise<{ buffer: Buffer; contentType: string }> {
  const apiKey = getApiKey();
  const url = `${MAPS_API_BASE}/photo?maxwidth=${maxWidthPx}&photo_reference=${photoRef}&key=${apiKey}`;

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Place photo fetch failed: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  };
}
