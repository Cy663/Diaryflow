import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Diary } from 'shared/types/diary';
import { getDiary } from '../../api/diary';
import DiaryDisplay from '../../components/DiaryDisplay';

function StudentDiary() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      navigate('/student');
      return;
    }
    getDiary(date)
      .then((res) => setDiary(res.diary))
      .catch((err) => setError(err.message === 'NOT_FOUND' ? 'No diary found for this date' : err.message))
      .finally(() => setLoading(false));
  }, [date, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/student')} className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!diary) return null;

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-amber-800">My Day</h1>
        <p className="text-amber-600">{date}</p>
      </div>

      <DiaryDisplay diary={diary} />

      <button
        onClick={() => navigate('/student')}
        className="mt-4 text-amber-600 hover:text-amber-800 transition"
      >
        &larr; Back to Home
      </button>
    </div>
  );
}

export default StudentDiary;
