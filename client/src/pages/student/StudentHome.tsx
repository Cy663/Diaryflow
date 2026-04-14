import { useEffect, useState } from 'react';
import type { Diary } from 'shared/types/diary';
import type { DiaryListItem } from 'shared/types/api';
import { getDiary, listDiaries } from '../../api/diary';
import DiaryDisplay from '../../components/DiaryDisplay';
import PageShell from '../../components/PageShell';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function StudentHome() {
  const today = new Date().toISOString().split('T')[0];

  const [diary, setDiary] = useState<Diary | null>(null);
  const [diaryDates, setDiaryDates] = useState<DiaryListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    listDiaries()
      .then((res) => setDiaryDates(res.diaries))
      .catch(() => setDiaryDates([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setDiary(null);
    getDiary(selectedDate)
      .then((res) => setDiary(res.diary))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const availableDates = new Set(diaryDates.map((d) => d.date));

  // Generate week dates with offset
  const weekDates: string[] = [];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + weekOffset * 7);
  for (let i = 0; i < 5; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  const weekLabel = (() => {
    const start = new Date(weekDates[0] + 'T12:00:00');
    const end = new Date(weekDates[4] + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} — ${end.toLocaleDateString('en-US', opts)}`;
  })();

  return (
    <PageShell variant="student" maxWidth="xl">
      <h1 className="text-2xl font-bold text-primary-800 mb-1 font-diary">My Diary</h1>

      {/* Week calendar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-medium text-secondary-600">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
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
                className={`py-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-md scale-[1.02]'
                    : hasEntry
                      ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      : 'bg-secondary-50 text-secondary-400 hover:bg-secondary-100'
                }`}
              >
                <div className="text-xs font-medium">{dayName}</div>
                <div className={`text-lg font-bold ${isToday && !isSelected ? 'underline decoration-primary-400 underline-offset-2' : ''}`}>
                  {dayNum}
                </div>
                {hasEntry && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {diaryDates.length > 0 && (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-secondary-200 rounded-lg px-3 py-2 text-sm text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 mt-3"
          >
            <option value={today}>Today ({today})</option>
            {diaryDates.map((d) => (
              <option key={d.id} value={d.date}>
                {d.date} ({new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })})
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Diary display */}
      <div className="flex flex-col items-center">
        {loading ? (
          <div className="py-16">
            <Spinner size="lg" label="Loading diary..." />
          </div>
        ) : notFound ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            title={`No diary for ${selectedDate}`}
            description={
              selectedDate === today
                ? "Your teacher hasn't created today's diary yet. Check back later!"
                : 'No diary was created for this date.'
            }
          />
        ) : diary ? (
          <>
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-primary-800 font-diary">My Day</h2>
              <p className="text-primary-600 text-sm">{selectedDate}</p>
            </div>
            <DiaryDisplay diary={diary} />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

export default StudentHome;
