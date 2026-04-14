import { useMemo, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { GpsPoint, DiaryPage } from 'shared/types/diary';

interface MiniMapProps {
  gpsTrace: GpsPoint[];
  currentPageIndex: number;
  pages: DiaryPage[];
  onMarkerClick?: (pageIndex: number) => void;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const MARKER_COLORS = [
  '#F59E0B', '#14B8A6', '#FB923C', '#F43F5E', '#8B5CF6',
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface PageStop {
  lat: number;
  lng: number;
  label: string;
  imageUrl: string;
  timeRange: string;
  pageIndex: number;
}

function usePageStops(gpsTrace: GpsPoint[], pages: DiaryPage[]): PageStop[] {
  return useMemo(() => {
    const stops: PageStop[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const [startStr, endStr] = page.timeRange.split(' - ');
      if (!startStr || !endStr) continue;
      const startMin = timeToMinutes(startStr);
      const endMin = timeToMinutes(endStr);

      const matching = gpsTrace.filter((p) => {
        const t = new Date(p.timestamp);
        const min = t.getHours() * 60 + t.getMinutes();
        return min >= startMin && min <= endMin;
      });

      if (matching.length > 0) {
        const avgLat = matching.reduce((s, p) => s + p.lat, 0) / matching.length;
        const avgLng = matching.reduce((s, p) => s + p.lng, 0) / matching.length;
        const shortLabel = page.activity.replace(
          /^(Lunch at|Playing at|Class at|Freeplay at|Transit at|Visiting)\s*/i, '',
        );
        stops.push({
          lat: avgLat,
          lng: avgLng,
          label: shortLabel,
          imageUrl: page.imageUrl,
          timeRange: page.timeRange,
          pageIndex: i,
        });
      }
    }
    return stops;
  }, [gpsTrace, pages]);
}

function buildMarkerContent(stop: PageStop, isActive: boolean, color: string): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));
    transition: all 0.2s;
  `;

  if (isActive) {
    // Expanded: show photo + name + time
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid ${color};
      max-width: 130px;
    `;

    if (stop.imageUrl) {
      const img = document.createElement('img');
      img.src = stop.imageUrl;
      img.alt = stop.label;
      img.style.cssText = `
        width: 100%;
        height: 50px;
        object-fit: cover;
        display: block;
      `;
      card.appendChild(img);
    }

    const textArea = document.createElement('div');
    textArea.style.cssText = `padding: 3px 5px; text-align: center;`;

    const name = document.createElement('div');
    name.textContent = stop.label;
    name.style.cssText = `
      font-size: 10px; font-weight: 700; color: #44403C;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-family: 'Nunito', system-ui, sans-serif;
    `;
    textArea.appendChild(name);

    const time = document.createElement('div');
    time.textContent = stop.timeRange;
    time.style.cssText = `
      font-size: 8px; color: #92400E; font-weight: 600; margin-top: 1px;
      font-family: 'Nunito', system-ui, sans-serif;
    `;
    textArea.appendChild(time);

    card.appendChild(textArea);
    container.appendChild(card);

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      width: 0; height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid ${color};
    `;
    container.appendChild(arrow);
  } else {
    // Compact: small pill with name only
    const pill = document.createElement('div');
    pill.style.cssText = `
      background: white;
      border: 1.5px solid ${color};
      border-radius: 12px;
      padding: 2px 8px;
      white-space: nowrap;
    `;

    const name = document.createElement('span');
    name.textContent = stop.label;
    name.style.cssText = `
      font-size: 10px; font-weight: 600; color: #44403C;
      font-family: 'Nunito', system-ui, sans-serif;
    `;
    pill.appendChild(name);
    container.appendChild(pill);

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 6px; height: 6px; border-radius: 50%;
      background: ${color}; margin-top: 2px;
    `;
    container.appendChild(dot);
  }

  return container;
}

/** Draws polylines and markers on the Google Map */
function MapContent({
  gpsTrace,
  pages,
  currentPageIndex,
  pageStops,
  onMarkerClick,
}: {
  gpsTrace: GpsPoint[];
  pages: DiaryPage[];
  currentPageIndex: number;
  pageStops: PageStop[];
  onMarkerClick?: (pageIndex: number) => void;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const markerLib = useMapsLibrary('marker');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const hasFittedRef = useRef(false);

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

  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const drawOverlays = useCallback(() => {
    if (!map || !coreLib || !markerLib) return;

    // Clear previous
    for (const p of polylinesRef.current) p.setMap(null);
    for (const m of markersRef.current) m.map = null;
    polylinesRef.current = [];
    markersRef.current = [];

    const toLatLng = (p: { lat: number; lng: number }) => new google.maps.LatLng(p.lat, p.lng);

    // Full faded trail
    const fullLine = new google.maps.Polyline({
      path: gpsTrace.map(toLatLng),
      strokeColor: '#FDE68A',
      strokeWeight: 3,
      strokeOpacity: 0.4,
      geodesic: true,
    });
    fullLine.setMap(map);
    polylinesRef.current.push(fullLine);

    // Visible solid trail
    const visibleLine = new google.maps.Polyline({
      path: gpsTrace.slice(0, visibleEndIndex + 1).map(toLatLng),
      strokeColor: '#D97706',
      strokeWeight: 4,
      strokeOpacity: 0.85,
      geodesic: true,
    });
    visibleLine.setMap(map);
    polylinesRef.current.push(visibleLine);

    // Rich markers per page stop
    for (const stop of pageStops) {
      const color = MARKER_COLORS[stop.pageIndex % MARKER_COLORS.length];
      const isActive = stop.pageIndex === currentPageIndex;

      const content = buildMarkerContent(stop, isActive, color);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: stop.lat, lng: stop.lng },
        content,
        title: stop.label,
        zIndex: isActive ? 100 : stop.pageIndex,
      });

      marker.addListener('click', () => {
        onMarkerClickRef.current?.(stop.pageIndex);
      });

      markersRef.current.push(marker);
    }

    // Fit bounds only on first render (let user zoom freely after)
    if (!hasFittedRef.current) {
      const bounds = new google.maps.LatLngBounds();
      for (const p of gpsTrace) bounds.extend(toLatLng(p));
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      hasFittedRef.current = true;
    }
  }, [map, coreLib, markerLib, gpsTrace, visibleEndIndex, pageStops, currentPageIndex]);

  useEffect(() => {
    drawOverlays();
  }, [drawOverlays]);

  useEffect(() => {
    return () => {
      for (const p of polylinesRef.current) p.setMap(null);
      for (const m of markersRef.current) m.map = null;
    };
  }, []);

  return null;
}

function MiniMap({ gpsTrace, currentPageIndex, pages, onMarkerClick }: MiniMapProps) {
  const pageStops = usePageStops(gpsTrace, pages);

  if (gpsTrace.length === 0 || !MAPS_API_KEY) return null;

  const center = useMemo(() => {
    const lats = gpsTrace.map((p) => p.lat);
    const lngs = gpsTrace.map((p) => p.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [gpsTrace]);

  return (
    <APIProvider apiKey={MAPS_API_KEY}>
      <Map
        defaultCenter={center}
        defaultZoom={15}
        mapId="diary-map"
        gestureHandling="greedy"
        zoomControl
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
      >
        <MapContent
          gpsTrace={gpsTrace}
          pages={pages}
          currentPageIndex={currentPageIndex}
          pageStops={pageStops}
          onMarkerClick={onMarkerClick}
        />
      </Map>
    </APIProvider>
  );
}

export default MiniMap;
