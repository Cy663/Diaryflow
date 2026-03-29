import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from 'shared/types/diary';
import { uploadPhotos, generateDiaryFromPhotos, parseSchedule } from '../api/diary';

function Create() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [scheduleFile, setScheduleFile] = useState<string | null>(null);
  const [parsingSchedule, setParsingSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // --- Schedule ---
  const handleScheduleUpload = async (file: File | undefined) => {
    if (!file) return;
    setParsingSchedule(true);
    setError(null);
    setScheduleFile(file.name);
    try {
      const entries = await parseSchedule(file);
      setSchedule(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse schedule');
    } finally {
      setParsingSchedule(false);
    }
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntry, value: string) => {
    setSchedule((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeScheduleEntry = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Photos ---
  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const entries = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...entries]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- Generate ---
  const handleGenerate = async () => {
    if (photos.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const uploaded = await uploadPhotos(
        photos.map((p) => p.file),
        [],
        [],
      );

      const res = await generateDiaryFromPhotos({
        childName: 'Alex',
        date: today,
        photos: uploaded,
        schedule: schedule.length > 0 ? schedule : undefined,
      });

      navigate('/diary', { state: { diary: res.diary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-4 py-8">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => navigate('/')}
          className="text-amber-600 hover:text-amber-800 transition mb-4"
        >
          &larr; Back to Home
        </button>

        <h1 className="text-3xl font-bold text-amber-800 mb-2">Create a Diary</h1>
        <p className="text-amber-600 mb-6">Upload a schedule and photos to generate a personalized diary</p>

        {/* Step 1: Schedule */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
            <label className="text-amber-700 font-medium">Upload Schedule</label>
          </div>

          {!scheduleFile ? (
            <label className="block border-2 border-dashed border-amber-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleScheduleUpload(e.target.files?.[0])}
                className="hidden"
              />
              <p className="text-amber-600 font-medium">Click to upload a schedule photo</p>
              <p className="text-amber-400 text-sm mt-1">We'll use AI to extract classes and times</p>
            </label>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-amber-600 text-sm">{scheduleFile}</span>
                <button
                  onClick={() => { setScheduleFile(null); setSchedule([]); }}
                  className="text-amber-400 hover:text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>

              {parsingSchedule && (
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-300 border-t-amber-600"></div>
                  <span className="text-sm">Parsing schedule...</span>
                </div>
              )}

              {schedule.length > 0 && (
                <div className="space-y-2">
                  {schedule.map((entry, i) => (
                    <div key={i} className="flex gap-2 items-center bg-amber-50 rounded-lg p-2 text-sm">
                      <input
                        value={entry.startTime}
                        onChange={(e) => updateScheduleEntry(i, 'startTime', e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                        placeholder="09:00"
                      />
                      <span className="text-amber-400">-</span>
                      <input
                        value={entry.endTime}
                        onChange={(e) => updateScheduleEntry(i, 'endTime', e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                        placeholder="10:00"
                      />
                      <input
                        value={entry.activity}
                        onChange={(e) => updateScheduleEntry(i, 'activity', e.target.value)}
                        className="flex-1 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                        placeholder="Activity"
                      />
                      <input
                        value={entry.location}
                        onChange={(e) => updateScheduleEntry(i, 'location', e.target.value)}
                        className="w-28 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                        placeholder="Location"
                      />
                      <button
                        onClick={() => removeScheduleEntry(i)}
                        className="text-amber-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!parsingSchedule && schedule.length === 0 && (
                <p className="text-amber-400 text-sm">No classes found. Try a clearer photo or add manually.</p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Photos */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
            <label className="text-amber-700 font-medium">Upload Photos</label>
          </div>

          <label className="block border-2 border-dashed border-amber-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition mb-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handlePhotos(e.target.files)}
              className="hidden"
            />
            <p className="text-amber-600 font-medium">Click to upload photos</p>
            <p className="text-amber-400 text-sm mt-1">
              {schedule.length > 0
                ? `Upload ${schedule.length} photos to match your ${schedule.length} classes`
                : 'JPG, PNG — up to 10MB each'}
            </p>
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img
                    src={photo.preview}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  {schedule[i] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                      {schedule[i].activity}
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0 right-0 bg-black/50 text-white w-5 h-5 rounded-bl-lg text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-4">
            {error}
          </div>
        )}

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={loading || photos.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-amber-500"
        >
          {loading ? 'Generating diary...' : `Generate Diary (${photos.length} photo${photos.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}

export default Create;
