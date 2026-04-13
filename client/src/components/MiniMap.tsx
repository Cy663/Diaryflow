import { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpsPoint, DiaryPage } from 'shared/types/diary';

interface MiniMapProps {
  gpsTrace: GpsPoint[];
  currentPageIndex: number;
  pages: DiaryPage[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Fits the map to bounds whenever they change */
function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  const boundsRef = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify(bounds);
    if (key !== boundsRef.current) {
      boundsRef.current = key;
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);

  return null;
}

function MiniMap({ gpsTrace, currentPageIndex, pages }: MiniMapProps) {
  // Compute bounds from all GPS points
  const bounds = useMemo<LatLngBoundsExpression>(() => {
    if (gpsTrace.length === 0) return [[0, 0], [0, 0]];
    const lats = gpsTrace.map((p) => p.lat);
    const lngs = gpsTrace.map((p) => p.lng);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [gpsTrace]);

  // Which GPS points are visible up to the current page
  const visibleEndIndex = useMemo(() => {
    if (pages.length === 0 || gpsTrace.length === 0) return 0;
    const page = pages[currentPageIndex];
    const endTime = page.timeRange.split(' - ')[1];
    const endMin = timeToMinutes(endTime);
    let lastIdx = 0;
    for (let i = 0; i < gpsTrace.length; i++) {
      const t = new Date(gpsTrace[i].timestamp);
      const min = t.getHours() * 60 + t.getMinutes();
      if (min <= endMin) lastIdx = i;
    }
    return lastIdx;
  }, [gpsTrace, pages, currentPageIndex]);

  // Full trail coordinates
  const fullTrail = useMemo<LatLngTuple[]>(
    () => gpsTrace.map((p) => [p.lat, p.lng]),
    [gpsTrace],
  );

  // Visible trail coordinates
  const visibleTrail = useMemo<LatLngTuple[]>(
    () => gpsTrace.slice(0, visibleEndIndex + 1).map((p) => [p.lat, p.lng]),
    [gpsTrace, visibleEndIndex],
  );

  // Key locations (deduplicated labels)
  const keyLocations = useMemo(() => {
    const seen = new Set<string>();
    const locs: { lat: number; lng: number; label: string }[] = [];
    for (const p of gpsTrace) {
      if (p.label && !seen.has(p.label)) {
        seen.add(p.label);
        locs.push({ lat: p.lat, lng: p.lng, label: p.label });
      }
    }
    return locs;
  }, [gpsTrace]);

  // Current position
  const currentPos = gpsTrace[visibleEndIndex];

  if (gpsTrace.length === 0) return null;

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds bounds={bounds} />

      {/* Faded full trail */}
      <Polyline
        positions={fullTrail}
        pathOptions={{ color: '#FDE68A', weight: 2, dashArray: '6 4', opacity: 0.5 }}
      />

      {/* Visible trail */}
      <Polyline
        positions={visibleTrail}
        pathOptions={{ color: '#D97706', weight: 3, opacity: 0.9 }}
      />

      {/* Key location markers */}
      {keyLocations.map((loc) => (
        <CircleMarker
          key={loc.label}
          center={[loc.lat, loc.lng]}
          radius={5}
          pathOptions={{ color: '#D97706', fillColor: '#FEF3C7', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -6]} permanent className="minimap-label">
            {loc.label}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Current position - highlighted dot */}
      {currentPos && (
        <>
          <CircleMarker
            center={[currentPos.lat, currentPos.lng]}
            radius={10}
            pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.3, weight: 0 }}
          />
          <CircleMarker
            center={[currentPos.lat, currentPos.lng]}
            radius={5}
            pathOptions={{ color: 'white', fillColor: '#F59E0B', fillOpacity: 1, weight: 2 }}
          />
        </>
      )}
    </MapContainer>
  );
}

export default MiniMap;
