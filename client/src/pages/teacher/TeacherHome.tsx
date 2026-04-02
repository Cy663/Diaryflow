import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from 'shared/types/diary';
import { getCurriculum, saveCurriculumApi, parseCurriculumImage } from '../../api/curriculum';
import { useAuth } from '../../contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function TeacherHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  const handleCurriculumUpload = async (file: File | undefined) => {
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
    const updated = curriculum.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setCurriculum(updated);
    await saveCurriculumApi(updated).catch(() => {});
  };

  const removeEntry = async (index: number) => {
    if (!curriculum) return;
    const updated = curriculum.filter((_, i) => i !== index);
    setCurriculum(updated);
    await saveCurriculumApi(updated).catch(() => {});
  };

  const entriesForDay = curriculum?.filter((e) => e.day === activeDay) || [];
  const daysWithEntries = curriculum
    ? DAYS.filter((d) => curriculum.some((e) => e.day === d))
    : [];

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-amber-800">DiaryFlow</h1>
            <p className="text-amber-600 text-sm">Teacher: {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-amber-500 hover:text-amber-700 text-sm transition"
          >
            Sign out
          </button>
        </div>

        {/* Curriculum Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-amber-700 font-semibold text-lg">Curriculum</h2>
            {curriculum && (
              <div className="flex gap-2">
                <label className="text-amber-500 hover:text-amber-700 text-sm cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCurriculumUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                  Re-upload
                </label>
                <button
                  onClick={handleClear}
                  className="text-amber-400 hover:text-red-500 text-sm transition"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {loadingCurr ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-300 border-t-amber-600"></div>
            </div>
          ) : !curriculum ? (
            <>
              <label className="block border-2 border-dashed border-amber-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCurriculumUpload(e.target.files?.[0])}
                  className="hidden"
                />
                {parsing ? (
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-300 border-t-amber-600"></div>
                    <span className="text-sm">Parsing curriculum...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-amber-600 font-medium">Upload school schedule</p>
                    <p className="text-amber-400 text-sm mt-1">
                      Take a photo of the weekly timetable — AI will extract all days
                    </p>
                  </>
                )}
              </label>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          ) : (
            <div>
              {/* Day tabs */}
              <div className="flex gap-1 mb-3">
                {(daysWithEntries.length > 0 ? daysWithEntries : DAYS).map((day) => {
                  const count = curriculum.filter((e) => e.day === day).length;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        activeDay === day
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      {day.slice(0, 3)}
                      {count > 0 && (
                        <span className={`ml-1 text-xs ${activeDay === day ? 'text-amber-200' : 'text-amber-400'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Editable entries */}
              {entriesForDay.length > 0 ? (
                <div className="space-y-2">
                  {entriesForDay.map((entry) => {
                    const globalIndex = curriculum.indexOf(entry);
                    return (
                      <div key={globalIndex} className="flex gap-2 items-center bg-amber-50 rounded-lg p-2 text-sm">
                        <input
                          value={entry.startTime}
                          onChange={(e) => updateEntry(globalIndex, 'startTime', e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                          placeholder="09:00"
                        />
                        <span className="text-amber-400">-</span>
                        <input
                          value={entry.endTime}
                          onChange={(e) => updateEntry(globalIndex, 'endTime', e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none text-center"
                          placeholder="10:00"
                        />
                        <input
                          value={entry.activity}
                          onChange={(e) => updateEntry(globalIndex, 'activity', e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                          placeholder="Activity"
                        />
                        <input
                          value={entry.location}
                          onChange={(e) => updateEntry(globalIndex, 'location', e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-amber-200 focus:border-amber-400 focus:outline-none"
                          placeholder="Location"
                        />
                        <button
                          onClick={() => removeEntry(globalIndex)}
                          className="text-amber-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-amber-400 text-sm text-center py-3">
                  No classes found for {activeDay}
                </p>
              )}

              {parsing && (
                <div className="flex items-center gap-2 text-amber-600 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-300 border-t-amber-600"></div>
                  <span className="text-sm">Parsing new curriculum...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Diary Button */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <p className="text-amber-500 text-sm mb-5">
            Upload GPS data and photos to generate a visual diary for your students
          </p>
          <button
            onClick={() => navigate('/teacher/create')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            Create Diary
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherHome;
