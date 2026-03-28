import { useMemo, useRef, useEffect, useState } from 'react';
import type { GpsPoint, DiaryPage } from 'shared/types/diary';

interface MiniMapProps {
  gpsTrace: GpsPoint[];
  currentPageIndex: number;
  pages: DiaryPage[];
}

// Normalize GPS coords to SVG viewBox space
function normalizePoints(points: GpsPoint[], padding: number = 20, width: number = 400, height: number = 150) {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  return points.map((p) => ({
    // Lng → x, Lat → y (inverted because SVG y goes down)
    x: padding + ((p.lng - minLng) / lngRange) * usableW,
    y: padding + ((maxLat - p.lat) / latRange) * usableH,
    label: p.label,
    timestamp: p.timestamp,
  }));
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function MiniMap({ gpsTrace, currentPageIndex, pages }: MiniMapProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const svgWidth = 400;
  const svgHeight = 150;

  const normalized = useMemo(
    () => normalizePoints(gpsTrace, 25, svgWidth, svgHeight),
    [gpsTrace],
  );

  // Figure out which GPS points belong to each page
  const pageEndIndices = useMemo(() => {
    return pages.map((page) => {
      const endTime = page.timeRange.split(' - ')[1];
      const endMin = timeToMinutes(endTime);
      // Find the last GPS point at or before this end time
      let lastIdx = 0;
      for (let i = 0; i < gpsTrace.length; i++) {
        const t = new Date(gpsTrace[i].timestamp);
        const min = t.getHours() * 60 + t.getMinutes();
        if (min <= endMin) lastIdx = i;
      }
      return lastIdx;
    });
  }, [gpsTrace, pages]);

  // Build the full path string
  const fullPath = useMemo(() => {
    if (normalized.length === 0) return '';
    return normalized
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }, [normalized]);

  // Compute cumulative segment lengths from normalized points
  const segmentLengths = useMemo(() => {
    const cumulative = [0];
    for (let i = 1; i < normalized.length; i++) {
      const dx = normalized[i].x - normalized[i - 1].x;
      const dy = normalized[i].y - normalized[i - 1].y;
      cumulative.push(cumulative[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    return cumulative;
  }, [normalized]);

  const totalVisualLength = segmentLengths[segmentLengths.length - 1] || 1;

  // Get total SVG path length for dash animation
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [fullPath]);

  // Calculate how much of the path to show based on actual visual distance
  const visibleEndIndex = pageEndIndices[currentPageIndex] ?? normalized.length - 1;
  const visibleFraction = segmentLengths[visibleEndIndex] / totalVisualLength;
  const dashOffset = pathLength * (1 - visibleFraction);

  // Current position (last visible point)
  const currentPos = normalized[visibleEndIndex];

  // Key location labels (deduplicate by label, pick first occurrence)
  const keyLocations = useMemo(() => {
    const seen = new Set<string>();
    const locations: { x: number; y: number; label: string }[] = [];
    const importantLabels = ['Metrotown Station', 'NEU Vancouver', "McDonald's", 'Granville Island'];
    for (const p of normalized) {
      if (importantLabels.includes(p.label) && !seen.has(p.label)) {
        seen.add(p.label);
        locations.push(p);
      }
    }
    return locations;
  }, [normalized]);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    >
      <defs>
        <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Faded full trail (shows where you'll go) */}
      <path
        d={fullPath}
        fill="none"
        stroke="#FDE68A"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.3"
      />

      {/* Animated visible trail */}
      <path
        ref={pathRef}
        d={fullPath}
        fill="none"
        stroke="url(#trailGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
      />

      {/* Key location dots */}
      {keyLocations.map((loc) => (
        <g key={loc.label}>
          <circle cx={loc.x} cy={loc.y} r="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <text
            x={loc.x}
            y={loc.y - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#92400E"
            fontWeight="500"
            fontFamily="system-ui, sans-serif"
          >
            {loc.label}
          </text>
        </g>
      ))}

      {/* Current position - pulsing dot */}
      {currentPos && (
        <g filter="url(#glow)">
          <circle cx={currentPos.x} cy={currentPos.y} r="6" fill="#F59E0B" opacity="0.4">
            <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={currentPos.x} cy={currentPos.y} r="4" fill="#F59E0B" stroke="white" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}

export default MiniMap;
