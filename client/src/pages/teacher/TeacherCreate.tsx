import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GpsInputPoint, ScheduleEntry } from 'shared/types/diary';
import { uploadPhotos, generateDiaryUnified } from '../../api/diary';
import { getCurriculum } from '../../api/curriculum';
import { extractTimestamp } from '../../utils/exif';
import MiniMap from '../../components/MiniMap';
import PageShell from '../../components/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FileUploadZone from '../../components/ui/FileUploadZone';
import ErrorAlert from '../../components/ui/ErrorAlert';
import CurriculumEditor from '../../components/CurriculumEditor';

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

const DEFAULT_PHOTO_TIMES = ['08:30', '09:45', '11:00', '12:30', '14:00'];
function getDefaultTime(index: number): string {
  if (index < DEFAULT_PHOTO_TIMES.length) return DEFAULT_PHOTO_TIMES[index];
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

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState<string>(Object.keys(PRESETS)[0]);
  const [jsonText, setJsonText] = useState(JSON.stringify(PRESETS[Object.keys(PRESETS)[0]], null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [savedCurriculum, setSavedCurriculum] = useState<ScheduleEntry[]>([]);
  const [editableCurriculum, setEditableCurriculum] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDayName = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    getCurriculum()
      .then((entries) => setSavedCurriculum(entries))
      .catch(() => setSavedCurriculum([]));
  }, []);

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

  let parsedPoints: GpsInputPoint[] = [];
  try {
    parsedPoints = JSON.parse(jsonText);
    if (!Array.isArray(parsedPoints)) parsedPoints = [];
  } catch {
    // parse error handled below
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

  const handlePhotos = async (files: File[]) => {
    const newEntries: PhotoEntry[] = [];
    const currentCount = photos.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const exifTs = await extractTimestamp(file);
      let timestamp: string;
      if (exifTs) {
        timestamp = exifTs;
      } else {
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
    <PageShell variant="teacher" maxWidth="md" backTo="/teacher" backLabel="Dashboard" title="Create Diary">
      <h1 className="text-2xl font-bold text-secondary-800 mb-1">Create a Diary</h1>
      <p className="text-secondary-500 text-sm mb-6">
        Select a date, add GPS data and/or photos, then generate.
      </p>

      {/* Date Picker */}
      <Card className="mb-4">
        <label className="text-secondary-700 font-medium text-sm block mb-2">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full border border-secondary-200 rounded-lg px-3 py-2.5 text-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
        />
        <p className="text-secondary-400 text-xs mt-1.5">{selectedDayName}</p>
      </Card>

      {/* GPS Tracking */}
      <Card className="mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="bg-secondary-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
          <label className="text-secondary-700 font-semibold text-sm">GPS Tracking</label>
          <span className="text-secondary-400 text-xs ml-auto">Optional</span>
        </div>

        {parsedPoints.length === 0 ? (
          <button
            onClick={() => handlePresetChange(Object.keys(PRESETS)[0])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Start Tracking
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                <span className="text-xs text-accent-600 font-medium">Tracking active</span>
              </div>
              <button
                onClick={() => { setJsonText('[]'); setSelectedPreset('custom'); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-error-500 text-white text-xs font-semibold hover:bg-error-600 transition"
              >
                <span className="w-2 h-2 bg-white rounded-sm" />
                Stop
              </button>
            </div>
            <p className="text-secondary-400 text-xs mt-2">
              9457 points recorded
              {firstTs && lastTs && ` · ${new Date(firstTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(lastTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </p>
            {previewTrace.length > 1 && (
              <div className="mt-3 h-30 rounded-lg overflow-hidden">
                <MiniMap gpsTrace={previewTrace} currentPageIndex={0} pages={dummyPages} />
              </div>
            )}
          </>
        )}

        <p className="text-secondary-400 text-xs mt-3">
          Tracks your location throughout the day to map the journey in the diary.
        </p>
      </Card>

      {/* Photos */}
      <Card className="mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="bg-secondary-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
          <label className="text-secondary-700 font-semibold text-sm">Photos</label>
          <span className="text-secondary-400 text-xs ml-auto">Optional</span>
        </div>

        <FileUploadZone
          accept="image/*"
          multiple
          label="Click to upload photos"
          helperText="iPhone photos — timestamps extracted from EXIF"
          onFiles={handlePhotos}
        />

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative group">
                <img src={photo.preview} alt={`Photo ${i + 1}`} className="w-full h-28 object-cover rounded-lg" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <input
                  type="time"
                  value={photo.timestamp ? isoToTimeValue(photo.timestamp) : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      updatePhotoTimestamp(i, `${selectedDate}T${e.target.value}:00`);
                    }
                  }}
                  className="w-full text-center text-xs text-secondary-600 bg-secondary-50 rounded-b-lg px-1 py-1 border border-secondary-200 focus:outline-none focus:border-primary-500 mt-1"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Curriculum */}
      <Card className="mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="bg-secondary-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
          <label className="text-secondary-700 font-semibold text-sm">Schedule for {selectedDayName}</label>
          <span className="text-secondary-400 text-xs ml-auto">Editable for this diary</span>
        </div>

        <CurriculumEditor
          entries={editableCurriculum}
          onUpdate={updateCurriculumEntry}
          onRemove={removeCurriculumEntry}
          onAdd={addCurriculumEntry}
          onReset={resetCurriculum}
          emptyMessage={`No classes for ${selectedDayName}`}
        />
        <p className="text-secondary-300 text-xs mt-3">Changes here are for this diary only — they won't update your saved curriculum</p>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Generate */}
      <div className="sticky bottom-4 z-20">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          loading={loading}
          size="lg"
          className="w-full shadow-lg"
        >
          {loading ? 'Generating Diary...' : `Generate Diary for ${selectedDate}`}
        </Button>
      </div>
    </PageShell>
  );
}

export default TeacherCreate;
