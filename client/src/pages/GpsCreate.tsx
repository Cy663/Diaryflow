import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GpsInputPoint } from 'shared/types/diary';
import { generateDiaryFromGps } from '../api/diary';
import MiniMap from '../components/MiniMap';

// Killarney Secondary School area — realistic school day for a student
// Locations verified against Google Places API:
//   Killarney Secondary School (49.2253, -123.0449)
//   Killarney Community Centre (49.2271, -123.0441)
//   A&W Canada — lunch (49.2195, -123.0410)
//   Killarney Park (49.2275, -123.0473)
const PRESET_KILLARNEY: GpsInputPoint[] = [
  // 8:20 — Parent drops off, walking to school entrance
  { timestamp: '2026-03-27T08:20:00', lat: 49.2248, lng: -123.0445 },
  // 8:30–11:30 — Morning classes at Killarney Secondary
  { timestamp: '2026-03-27T08:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T09:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T09:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T10:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T10:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T11:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T11:30:00', lat: 49.2253, lng: -123.0449 },
  // 11:40 — Walk to community centre
  { timestamp: '2026-03-27T11:40:00', lat: 49.2260, lng: -123.0445 },
  // 11:45–12:25 — Activity at Killarney Community Centre (entrance coords)
  { timestamp: '2026-03-27T11:45:00', lat: 49.2268, lng: -123.0445 },
  { timestamp: '2026-03-27T12:00:00', lat: 49.2268, lng: -123.0445 },
  { timestamp: '2026-03-27T12:25:00', lat: 49.2268, lng: -123.0445 },
  // 12:30 — Walk south toward A&W for lunch
  { timestamp: '2026-03-27T12:30:00', lat: 49.2240, lng: -123.0430 },
  // 12:40–13:10 — Lunch at A&W (exact Google coords)
  { timestamp: '2026-03-27T12:40:00', lat: 49.2197, lng: -123.0408 },
  { timestamp: '2026-03-27T12:55:00', lat: 49.2197, lng: -123.0408 },
  { timestamp: '2026-03-27T13:10:00', lat: 49.2197, lng: -123.0408 },
  // 13:20 — Walk to park
  { timestamp: '2026-03-27T13:20:00', lat: 49.2235, lng: -123.0440 },
  // 13:30–14:30 — Outdoor time at Killarney Park
  { timestamp: '2026-03-27T13:30:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T13:50:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T14:10:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T14:30:00', lat: 49.2275, lng: -123.0473 },
  // 14:35 — Walk back to school
  { timestamp: '2026-03-27T14:35:00', lat: 49.2265, lng: -123.0460 },
  // 14:45–15:15 — Afternoon at school, waiting for pickup
  { timestamp: '2026-03-27T14:45:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T15:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T15:15:00', lat: 49.2253, lng: -123.0449 },
];

const PRESETS: Record<string, GpsInputPoint[]> = {
  "Alex's Day at Killarney Secondary — Vancouver": PRESET_KILLARNEY,
};

function GpsCreate() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [selectedPreset, setSelectedPreset] = useState<string>(Object.keys(PRESETS)[0]);
  const [jsonText, setJsonText] = useState(JSON.stringify(PRESETS[Object.keys(PRESETS)[0]], null, 2));
  const [childName, setChildName] = useState('Alex');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  let parsedPoints: GpsInputPoint[] = [];
  try {
    parsedPoints = JSON.parse(jsonText);
    if (!Array.isArray(parsedPoints)) parsedPoints = [];
  } catch {
    // will show parse error
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setJsonText('[\n  { "timestamp": "2026-03-27T09:00:00", "lat": 49.28, "lng": -123.12 }\n]');
    } else {
      setJsonText(JSON.stringify(PRESETS[preset], null, 2));
    }
    setParseError(null);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError('Must be a JSON array');
      } else {
        setParseError(null);
      }
    } catch {
      setParseError('Invalid JSON');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const points: GpsInputPoint[] = JSON.parse(jsonText);
      const { diary } = await generateDiaryFromGps({
        childName: childName || 'Alex',
        date: today,
        gpsPoints: points,
      });
      navigate('/diary', { state: { diary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diary');
    } finally {
      setLoading(false);
    }
  };

  // Build a minimal gpsTrace for MiniMap preview
  const previewTrace = parsedPoints.map((p) => ({
    timestamp: p.timestamp,
    lat: p.lat,
    lng: p.lng,
    label: '',
  }));

  // Dummy page covering full time range for MiniMap to show all points
  const firstTs = parsedPoints[0]?.timestamp;
  const lastTs = parsedPoints[parsedPoints.length - 1]?.timestamp;
  const dummyPages = firstTs && lastTs ? [{
    pageNumber: 1,
    imageUrl: '',
    illustrationUrl: '',
    text: '',
    timeRange: `${new Date(firstTs).getHours().toString().padStart(2, '0')}:${new Date(firstTs).getMinutes().toString().padStart(2, '0')} - ${new Date(lastTs).getHours().toString().padStart(2, '0')}:${new Date(lastTs).getMinutes().toString().padStart(2, '0')}`,
    activity: '',
  }] : [];

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-amber-600 hover:text-amber-800 mb-4 inline-block"
        >
          &larr; Back to Home
        </button>

        <h1 className="text-3xl font-bold text-amber-800 mb-6">GPS Diary</h1>
        <p className="text-amber-600 mb-6">
          Generate a diary automatically from GPS coordinates — no photos needed.
          The system clusters stops, queries Google Places for names and images, and builds a visual diary.
        </p>

        {/* Child Name */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label className="block text-amber-700 font-semibold mb-2">Child Name</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* GPS Data */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label className="block text-amber-700 font-semibold mb-2">GPS Data</label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 mb-3 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="custom">Custom (enter your own)</option>
          </select>

          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={10}
            className="w-full font-mono text-sm border border-amber-300 rounded-lg px-3 py-2 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            spellCheck={false}
          />

          {parseError && (
            <p className="text-red-500 text-sm mt-1">{parseError}</p>
          )}

          <p className="text-amber-500 text-sm mt-2">
            {parsedPoints.length} points
            {firstTs && lastTs && ` · ${new Date(firstTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(lastTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>

        {/* Map Preview */}
        {previewTrace.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <h2 className="text-amber-700 font-semibold mb-3">Route Preview</h2>
            <MiniMap
              gpsTrace={previewTrace}
              currentPageIndex={0}
              pages={dummyPages}
            />
          </div>
        )}

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={loading || !!parseError || parsedPoints.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Diary...
            </span>
          ) : (
            'Generate GPS Diary'
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default GpsCreate;
