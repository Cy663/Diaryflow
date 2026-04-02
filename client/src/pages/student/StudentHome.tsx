import { useEffect, useState } from 'react';
import type { Diary } from 'shared/types/diary';
import type { DiaryListItem } from 'shared/types/api';
import { getDiary, listDiaries } from '../../api/diary';
import { useAuth } from '../../contexts/AuthContext';
import DiaryDisplay from '../../components/DiaryDisplay';

function StudentHome() {
  const { user, logout } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [diary, setDiary] = useState<Diary | null>(null);
  const [diaryDates, setDiaryDates] = useState<DiaryListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load diary list
  useEffect(() => {
    listDiaries()
      .then((res) => setDiaryDates(res.diaries))
      .catch(() => setDiaryDates([]));
  }, []);

  // Load diary for selected date
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setDiary(null);
    getDiary(selectedDate)
      .then((res) => setDiary(res.diary))
      .catch((err) => {
        if (err.message === 'NOT_FOUND') setNotFound(true);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Get dates that have diaries for calendar highlighting
  const availableDates = new Set(diaryDates.map((d) => d.date));

  // Generate a week view centered on today
  const weekDates: string[] = [];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
  for (let i = 0; i < 5; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-4 py-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-800">My Diary</h1>
            <p className="text-amber-600 text-sm">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-amber-500 hover:text-amber-700 text-sm transition"
          >
            Sign out
          </button>
        </div>

        {/* Week calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="text-amber-700 font-semibold text-sm mb-3">This Week</h2>
          <div className="flex gap-2">
            {weekDates.map((date) => {
              const d = new Date(date + 'T12:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = d.getDate();
              const hasEntry = availableDates.has(date);
              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-1 py-3 rounded-xl text-center transition ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md'
                      : hasEntry
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-medium">{dayName}</div>
                  <div className={`text-lg font-bold ${isToday && !isSelected ? 'underline' : ''}`}>{dayNum}</div>
                  {hasEntry && !isSelected && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mx-auto mt-1"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* All dates dropdown for past weeks */}
          {diaryDates.length > 0 && (
            <div className="mt-3">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value={today}>Today ({today})</option>
                {diaryDates.map((d) => (
                  <option key={d.id} value={d.date}>
                    {d.date} ({new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Diary display */}
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-amber-600 mx-auto mb-4"></div>
              <p className="text-amber-600">Loading diary...</p>
            </div>
          ) : notFound ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
              <p className="text-amber-700 text-lg font-medium mb-2">No diary for {selectedDate}</p>
              <p className="text-amber-500 text-sm">
                {selectedDate === today
                  ? "Your teacher hasn't created today's diary yet. Check back later!"
                  : 'No diary was created for this date.'}
              </p>
            </div>
          ) : diary ? (
            <>
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">My Day</h2>
                <p className="text-amber-600">{selectedDate}</p>
              </div>
              <DiaryDisplay diary={diary} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
