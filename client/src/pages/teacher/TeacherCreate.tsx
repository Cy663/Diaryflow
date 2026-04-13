import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GpsInputPoint, ScheduleEntry } from 'shared/types/diary';
import { uploadPhotos, generateDiaryUnified } from '../../api/diary';
import { getCurriculum } from '../../api/curriculum';
import { extractTimestamp } from '../../utils/exif';
import MiniMap from '../../components/MiniMap';

// Killarney Secondary School area preset
const PRESET_KILLARNEY: GpsInputPoint[] = [
  { timestamp: '2026-03-27T08:20:00', lat: 49.2248, lng: -123.0445 },
  { timestamp: '2026-03-27T08:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T09:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T09:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T10:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T10:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T11:00:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T11:30:00', lat: 49.2253, lng: -123.0449 },
  { timestamp: '2026-03-27T11:40:00', lat: 49.2260, lng: -123.0445 },
  { timestamp: '2026-03-27T11:45:00', lat: 49.2268, lng: -123.0445 },
  { timestamp: '2026-03-27T12:00:00', lat: 49.2268, lng: -123.0445 },
  { timestamp: '2026-03-27T12:25:00', lat: 49.2268, lng: -123.0445 },
  { timestamp: '2026-03-27T12:30:00', lat: 49.2240, lng: -123.0430 },
  { timestamp: '2026-03-27T12:40:00', lat: 49.2197, lng: -123.0408 },
  { timestamp: '2026-03-27T12:55:00', lat: 49.2197, lng: -123.0408 },
  { timestamp: '2026-03-27T13:10:00', lat: 49.2197, lng: -123.0408 },
  { timestamp: '2026-03-27T13:20:00', lat: 49.2235, lng: -123.0440 },
  { timestamp: '2026-03-27T13:30:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T13:50:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T14:10:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T14:30:00', lat: 49.2275, lng: -123.0473 },
  { timestamp: '2026-03-27T14:35:00', lat: 49.2270, lng: -123.0430 },
  { timestamp: '2026-03-27T14:45:00', lat: 49.2268, lng: -123.0370 },
  { timestamp: '2026-03-27T15:00:00', lat: 49.2268, lng: -123.0370 },
  { timestamp: '2026-03-27T15:15:00', lat: 49.2268, lng: -123.0370 },
];

const PRESETS: Record<string, GpsInputPoint[]> = {
  'Killarney Secondary — Vancouver': PRESET_KILLARNEY,
};

// Default school-day times for photos without EXIF data
const DEFAULT_PHOTO_TIMES = ['08:30', '09:45', '11:00', '12:30', '14:00'];
function getDefaultTime(index: number): string {
  if (index < DEFAULT_PHOTO_TIMES.length) return DEFAULT_PHOTO_TIMES[index];
  // Beyond 5 photos, space by 1 hour starting from 15:00
  const h = 15 + (index - DEFAULT_PHOTO_TIMES.length);
  return `${String(Math.min(h, 17)).padStart(2, '0')}:00`;
}

function isoToTimeValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface PhotoEntry {
  file: File;
  preview: string;
  timestamp: string | null;
}

function TeacherCreate() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Date picker
  const [selectedDate, setSelectedDate] = useState(today);

  // GPS state
  const [selectedPreset, setSelectedPreset] = useState<string>(Object.keys(PRESETS)[0]);
  const [jsonText, setJsonText] = useState(JSON.stringify(PRESETS[Object.keys(PRESETS)[0]], null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  // Photo state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // Curriculum state — saved version from DB + editable local version for this generation
  const [savedCurriculum, setSavedCurriculum] = useState<ScheduleEntry[]>([]);
  const [editableCurriculum, setEditableCurriculum] = useState<ScheduleEntry[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDayName = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    getCurriculum()
      .then((entries) => setSavedCurriculum(entries))
      .catch(() => setSavedCurriculum([]));
  }, []);

  // Reset editable curriculum when date or saved curriculum changes
  useEffect(() => {
    setEditableCurriculum(savedCurriculum.filter((e) => e.day === selectedDayName));
  }, [savedCurriculum, selectedDayName]);

  const resetCurriculum = () => {
    setEditableCurriculum(savedCurriculum.filter((e) => e.day === selectedDayName));
  };

  const updateCurriculumEntry = (index: number, field: keyof ScheduleEntry, value: string) => {
    setEditableCurriculum((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeCurriculumEntry = (index: number) => {
    setEditableCurriculum((prev) => prev.filter((_, i) => i !== index));
  };

  const addCurriculumEntry = () => {
    setEditableCurriculum((prev) => [...prev, { day: selectedDayName, startTime: '', endTime: '', activity: '', location: '', imageKey: '' }]);
  };

  // --- GPS ---
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
      if (!Array.isArray(parsed)) setParseError('Must be a JSON array');
      else setParseError(null);
    } catch {
      setParseError('Invalid JSON');
    }
  };

  // --- Photos ---
  const handlePhotos = async (files: FileList | null) => {
    if (!files) return;
    const newEntries: PhotoEntry[] = [];
    const currentCount = photos.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const exifTs = await extractTimestamp(file);
      let timestamp: string;
      if (exifTs) {
        timestamp = exifTs;
      } else {
        // No EXIF — assign a default school-day time
        const defaultTime = getDefaultTime(currentCount + i);
        timestamp = `${selectedDate}T${defaultTime}:00`;
      }
      newEntries.push({ file, preview: URL.createObjectURL(file), timestamp });
    }
    setPhotos((prev) => [...prev, ...newEntries]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePhotoTimestamp = (index: number, value: string) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, timestamp: value } : p));
  };

  // --- Generate ---
  const canGenerate = !loading && (parsedPoints.length > 0 || photos.length > 0) && !parseError;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let photoPayload: { url: string; timestamp: string }[] = [];
      if (photos.length > 0) {
        const uploaded = await uploadPhotos(
          photos.map((p) => p.file),
          [],
          photos.map((p) => p.timestamp || ''),
          selectedDate,
        );
        photoPayload = uploaded.map((u, i) => ({
          url: u.url,
          timestamp: photos[i].timestamp || new Date().toISOString(),
        }));
      }

      const { diary } = await generateDiaryUnified({
        date: selectedDate,
        gpsPoints: parsedPoints.length > 0 ? parsedPoints : [],
        photos: photoPayload,
        curriculum: editableCurriculum.length > 0 ? editableCurriculum : undefined,
      });

      navigate(`/teacher/diary/${selectedDate}`, { state: { diary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // MiniMap preview
  const previewTrace = parsedPoints.map((p) => ({
    timestamp: p.timestamp, lat: p.lat, lng: p.lng, label: '',
  }));
  const firstTs = parsedPoints[0]?.timestamp;
  const lastTs = parsedPoints[parsedPoints.length - 1]?.timestamp;
  const dummyPages = firstTs && lastTs ? [{
    pageNumber: 1, imageUrl: '', illustrationUrl: '', text: '',
    timeRange: `${new Date(firstTs).getHours().toString().padStart(2, '0')}:${new Date(firstTs).getMinutes().toString().padStart(2, '0')} - ${new Date(lastTs).getHours().toString().padStart(2, '0')}:${new Date(lastTs).getMinutes().toString().padStart(2, '0')}`,
    activity: '',
  }] : [];

  return (
    <div className="min-h-screen bg-amber-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/teacher')}
          className="text-amber-600 hover:text-amber-800 transition mb-4"
        >
          &larr; Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-amber-800 mb-2">Create a Diary</h1>
        <p className="text-amber-600 mb-6">
          Select a date, add GPS data and/or photos, then generate.
        </p>

        {/* Date Picker */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label className="text-amber-700 font-medium block mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="text-amber-500 text-sm mt-1">{selectedDayName}</p>
        </div>

        {/* GPS Data */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
            <label className="text-amber-700 font-medium">GPS Data</label>
            <span className="text-amber-400 text-xs ml-auto">Optional</span>
          </div>

          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full border border-amber-300 rounded-lg px-3 py-2 mb-3 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="custom">Custom (paste your own)</option>
          </select>

          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={6}
            className="w-full font-mono text-xs border border-amber-300 rounded-lg px-3 py-2 text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            spellCheck={false}
          />
          {parseError && <p className="text-red-500 text-sm mt-1">{parseError}</p>}
          <p className="text-amber-500 text-sm mt-2">
            {parsedPoints.length} points
            {firstTs && lastTs && ` · ${new Date(firstTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(lastTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
          {previewTrace.length > 1 && (
            <div className="mt-3 h-[120px]">
              <MiniMap gpsTrace={previewTrace} currentPageIndex={0} pages={dummyPages} />
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
            <label className="text-amber-700 font-medium">Photos</label>
            <span className="text-amber-400 text-xs ml-auto">Optional</span>
          </div>

          <label className="block border-2 border-dashed border-amber-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition mb-3">
            <input type="file" multiple accept="image/*" onChange={(e) => handlePhotos(e.target.files)} className="hidden" />
            <p className="text-amber-600 font-medium">Click to upload photos</p>
            <p className="text-amber-400 text-sm mt-1">iPhone photos — timestamps extracted from EXIF</p>
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img src={photo.preview} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0 right-0 bg-black/50 text-white w-5 h-5 rounded-bl-lg text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    &times;
                  </button>
                  <input
                    type="time"
                    value={photo.timestamp ? isoToTimeValue(photo.timestamp) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        updatePhotoTimestamp(i, `${selectedDate}T${e.target.value}:00`);
                      }
                    }}
                    className="w-full text-center text-xs text-amber-600 bg-amber-50 rounded-b-lg px-1 py-0.5 border border-amber-200 focus:outline-none focus:border-amber-400 mt-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Curriculum (editable for this generation only) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</span>
            <label className="text-amber-700 font-medium">Schedule for {selectedDayName}</label>
            <span className="text-amber-400 text-xs ml-auto">Editable for this diary</span>
          </div>

          {editableCurriculum.length > 0 ? (
            <div className="space-y-2 mb-3">
              {editableCurriculum.map((entry, i) => (
                <div key={i} className="flex gap-2 items-center bg-amber-50 rounded-lg p-2 text-sm">
                  <input
                    value={entry.startTime}
                    onChange={(e) => updateCurriculumEntry(i, 'startTime', e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                    placeholder="09:00"
                  />
                  <span className="text-amber-400">-</span>
                  <input
                    value={entry.endTime}
                    onChange={(e) => updateCurriculumEntry(i, 'endTime', e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                    placeholder="10:00"
                  />
                  <input
                    value={entry.activity}
                    onChange={(e) => updateCurriculumEntry(i, 'activity', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                    placeholder="Activity"
                  />
                  <input
                    value={entry.location}
                    onChange={(e) => updateCurriculumEntry(i, 'location', e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                    placeholder="Location"
                  />
                  <button
                    onClick={() => removeCurriculumEntry(i)}
                    className="text-amber-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-400 text-sm mb-3">No classes for {selectedDayName}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={addCurriculumEntry}
              className="text-amber-500 hover:text-amber-700 text-sm transition"
            >
              + Add entry
            </button>
            <button
              onClick={resetCurriculum}
              className="text-amber-400 hover:text-amber-600 text-sm transition"
            >
              Reset to saved
            </button>
          </div>
          <p className="text-amber-300 text-xs mt-2">Changes here are for this diary only — they won't update your saved curriculum</p>
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-4">{error}</div>}

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-amber-500"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Diary...
            </span>
          ) : (
            `Generate Diary for ${selectedDate}`
          )}
        </button>
      </div>
    </div>
  );
}

export default TeacherCreate;
