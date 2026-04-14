import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry, PresetLocation } from 'shared/types/diary';
import { getCurriculum, saveCurriculumApi, parseCurriculumImage } from '../../api/curriculum';
import { getPresetLocations, createPresetLocation, deletePresetLocation } from '../../api/preset-locations';
import PageShell from '../../components/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FileUploadZone from '../../components/ui/FileUploadZone';
import ErrorAlert from '../../components/ui/ErrorAlert';
import CurriculumEditor from '../../components/CurriculumEditor';
import LocationPicker from '../../components/LocationPicker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function TeacherHome() {
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState<ScheduleEntry[] | null>(null);
  const [loadingCurr, setLoadingCurr] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string>(() => {
    const dow = new Date().getDay();
    return DAYS[Math.max(0, Math.min(dow - 1, 4))];
  });

  useEffect(() => {
    getCurriculum()
      .then((entries) => setCurriculum(entries.length > 0 ? entries : null))
      .catch(() => setCurriculum(null))
      .finally(() => setLoadingCurr(false));
  }, []);

  const handleCurriculumUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const entries = await parseCurriculumImage(file);
      if (entries.length === 0) {
        setError('Could not parse any classes from the image. Try a clearer photo.');
        return;
      }
      setCurriculum(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse curriculum');
    } finally {
      setParsing(false);
    }
  };

  const handleClear = async () => {
    setCurriculum(null);
    await saveCurriculumApi([]).catch(() => {});
  };

  const updateEntry = async (index: number, field: keyof ScheduleEntry, value: string) => {
    if (!curriculum) return;
    const globalIndex = entriesForDay.length > 0
      ? curriculum.indexOf(entriesForDay[index])
      : index;
    const updated = curriculum.map((e, i) => (i === globalIndex ? { ...e, [field]: value } : e));
    setCurriculum(updated);
    await saveCurriculumApi(updated).catch(() => {});
  };

  const removeEntry = async (index: number) => {
    if (!curriculum) return;
    const globalIndex = curriculum.indexOf(entriesForDay[index]);
    const updated = curriculum.filter((_, i) => i !== globalIndex);
    setCurriculum(updated);
    await saveCurriculumApi(updated).catch(() => {});
  };

  // --- Preset Locations ---
  const [presets, setPresets] = useState<PresetLocation[]>([]);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetLat, setNewPresetLat] = useState<number | undefined>();
  const [newPresetLng, setNewPresetLng] = useState<number | undefined>();
  const [newPresetRadius, setNewPresetRadius] = useState(50);
  const [presetLoading, setPresetLoading] = useState(false);

  useEffect(() => {
    getPresetLocations()
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  const handleAddPreset = async () => {
    if (!newPresetName || newPresetLat === undefined || newPresetLng === undefined) return;
    setPresetLoading(true);
    try {
      const created = await createPresetLocation({
        name: newPresetName,
        lat: newPresetLat,
        lng: newPresetLng,
        radiusM: newPresetRadius,
      });
      setPresets((prev) => [...prev, created]);
      setNewPresetName('');
      setNewPresetLat(undefined);
      setNewPresetLng(undefined);
      setNewPresetRadius(50);
      setShowAddPreset(false);
    } catch {
      // handled silently
    } finally {
      setPresetLoading(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    await deletePresetLocation(id).catch(() => {});
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const entriesForDay = curriculum?.filter((e) => e.day === activeDay) || [];
  const daysWithEntries = curriculum
    ? DAYS.filter((d) => curriculum.some((e) => e.day === d))
    : [];

  return (
    <PageShell variant="teacher" maxWidth="md">
      {/* Curriculum Section */}
      <Card
        className="mb-5"
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-secondary-800 font-semibold">Curriculum</h2>
            {curriculum && (
              <div className="flex gap-3">
                <label className="text-sm text-primary-500 hover:text-primary-700 cursor-pointer transition font-medium">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCurriculumUpload([f]);
                    }}
                    className="hidden"
                  />
                  Re-upload
                </label>
                <button
                  onClick={handleClear}
                  className="text-sm text-secondary-400 hover:text-error-500 transition"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        }
      >
        {loadingCurr ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : !curriculum ? (
          <>
            <FileUploadZone
              accept="image/*"
              label="Upload school schedule"
              helperText="Take a photo of the weekly timetable — AI will extract all days"
              loading={parsing}
              loadingText="Parsing curriculum..."
              onFiles={handleCurriculumUpload}
            />
            <p className="text-xs text-secondary-400 mt-2 text-center">
              Please do not upload schedules containing student names or personal information.
            </p>
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          </>
        ) : (
          <div>
            {/* Day tabs */}
            <div className="flex gap-1 mb-4">
              {(daysWithEntries.length > 0 ? daysWithEntries : DAYS).map((day) => {
                const count = curriculum.filter((e) => e.day === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeDay === day
                        ? 'bg-secondary-700 text-white'
                        : 'bg-secondary-50 text-secondary-500 hover:bg-secondary-100'
                    }`}
                  >
                    {day.slice(0, 3)}
                    {count > 0 && (
                      <span className={`ml-1 text-xs ${activeDay === day ? 'text-secondary-300' : 'text-secondary-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <CurriculumEditor
              entries={entriesForDay}
              onUpdate={updateEntry}
              onRemove={removeEntry}
              emptyMessage={`No classes found for ${activeDay}`}
            />

            {parsing && (
              <div className="flex items-center gap-2 text-primary-600 mt-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-600" />
                <span className="text-sm">Parsing new curriculum...</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Preset Locations Section */}
      <Card
        className="mb-5"
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-secondary-800 font-semibold">Preset Locations</h2>
            <button
              onClick={() => setShowAddPreset(!showAddPreset)}
              className="text-sm text-primary-500 hover:text-primary-700 transition font-medium"
            >
              {showAddPreset ? 'Cancel' : '+ Add'}
            </button>
          </div>
        }
      >
        {showAddPreset && (
          <div className="mb-4 pb-4 border-b border-secondary-100">
            <div className="space-y-3">
              <Input
                label="Location name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Classroom 101, Cafeteria"
              />
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Click on map to set location
                </label>
                <LocationPicker
                  lat={newPresetLat}
                  lng={newPresetLng}
                  radiusM={newPresetRadius}
                  onLocationChange={(lat, lng) => {
                    setNewPresetLat(lat);
                    setNewPresetLng(lng);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Radius: {newPresetRadius}m
                </label>
                <input
                  type="range"
                  min={25}
                  max={200}
                  step={5}
                  value={newPresetRadius}
                  onChange={(e) => setNewPresetRadius(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-secondary-400">
                  <span>25m</span>
                  <span>200m</span>
                </div>
              </div>
              {newPresetLat !== undefined && (
                <p className="text-xs text-secondary-400">
                  Coordinates: {newPresetLat.toFixed(6)}, {newPresetLng?.toFixed(6)}
                </p>
              )}
              <Button
                onClick={handleAddPreset}
                disabled={!newPresetName || newPresetLat === undefined}
                loading={presetLoading}
                size="sm"
              >
                Save Location
              </Button>
            </div>
          </div>
        )}

        {presets.length === 0 && !showAddPreset ? (
          <p className="text-sm text-secondary-400 text-center py-3">
            No preset locations defined. GPS clusters will use Google Places for labels.
          </p>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between bg-secondary-50 rounded-lg px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-secondary-700 truncate">{preset.name}</p>
                  <p className="text-xs text-secondary-400">
                    {preset.lat.toFixed(4)}, {preset.lng.toFixed(4)} · {preset.radiusM}m radius
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="text-secondary-300 hover:text-error-500 transition shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Diary CTA */}
      <Card className="text-center">
        <div className="py-2">
          <svg className="w-12 h-12 mx-auto mb-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-secondary-500 text-sm mb-4">
            Upload GPS data and photos to generate a visual diary for your students
          </p>
          <Button
            onClick={() => navigate('/teacher/create')}
            size="lg"
            className="w-full"
          >
            Create Diary
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}

export default TeacherHome;
