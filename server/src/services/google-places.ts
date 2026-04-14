import type { StayCluster, PresetLocation } from '../../../shared/src/types/diary';
import { haversineMeters } from './gps-clustering';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

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

  const url = `${PLACES_API_BASE}/places:searchNearby`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.types,places.photos',
    },
    body: JSON.stringify({
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 50.0,
        },
      },
      maxResultCount: 10,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[Places] API error:', res.status, body);
    throw new Error(`Places API returned ${res.status}`);
  }

  const data = await res.json() as {
    places?: Array<{
      displayName?: { text?: string };
      types?: string[];
      photos?: Array<{ name?: string }>;
    }>;
  };

  const results = data.places || [];
  console.log('[Places] got', results.length, 'results');

  // Rank results: prefer meaningful places (school, park, restaurant, library)
  // over generic POIs (ATMs, insurance), over routes/localities
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
    return (b.photos?.length || 0) - (a.photos?.length || 0);
  });
  const poi = ranked[0];

  if (!poi) {
    return { displayName: 'Location', types: [], photoRef: null };
  }

  // New API photo name format: "places/{placeId}/photos/{photoRef}"
  const photoRef = poi.photos?.[0]?.name || null;

  return {
    displayName: poi.displayName?.text || 'Unknown Place',
    types: poi.types || [],
    photoRef,
  };
}

export async function enrichClustersWithPlaces(
  clusters: StayCluster[],
  presetLocations?: PresetLocation[],
): Promise<void> {
  for (const cluster of clusters) {
    // Check preset locations first
    if (presetLocations && presetLocations.length > 0) {
      const match = presetLocations.find((preset) => {
        const dist = haversineMeters(
          cluster.centroid.lat, cluster.centroid.lng,
          preset.lat, preset.lng,
        );
        return dist <= preset.radiusM;
      });

      if (match) {
        cluster.placeName = match.name;
        cluster.placeSource = 'preset';
        continue;
      }
    }

    // Fall back to Google Places API
    try {
      console.log('[Places] querying for cluster at', cluster.centroid, '| API key present:', !!process.env.GOOGLE_PLACES_API_KEY);
      const result = await queryPlaceForCluster(cluster);
      console.log('[Places] result:', JSON.stringify(result));
      cluster.placeName = result.displayName;
      cluster.placeTypes = result.types;
      cluster.photoRef = result.photoRef ?? undefined;
      cluster.placeSource = 'google-places';
    } catch (err) {
      console.error('Places API error for cluster:', err);
      cluster.placeName = `Location at ${cluster.centroid.lat.toFixed(4)},${cluster.centroid.lng.toFixed(4)}`;
      cluster.placeTypes = [];
      cluster.photoRef = undefined;
      cluster.placeSource = 'fallback';
    }
  }
}

export async function fetchPlacePhoto(
  photoName: string,
  maxWidthPx = 800,
): Promise<{ buffer: Buffer; contentType: string }> {
  const apiKey = getApiKey();
  // New API: GET /v1/{photoName}/media?maxWidthPx=N&key=KEY
  const url = `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Place photo fetch failed: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  };
}
