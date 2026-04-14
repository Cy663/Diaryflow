import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Diary } from 'shared/types/diary';
import { getDiary } from '../../api/diary';
import DiaryDisplay from '../../components/DiaryDisplay';
import PageShell from '../../components/PageShell';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Button from '../../components/ui/Button';

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

  return (
    <PageShell variant="student" maxWidth="lg" backTo="/student" backLabel="Home" title={`Diary — ${date}`}>
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading diary..." />
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto mt-12">
          <ErrorAlert message={error} />
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => navigate('/student')}>
              Back to Home
            </Button>
          </div>
        </div>
      ) : diary ? (
        <div className="flex flex-col items-center">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-primary-800 font-diary">My Day</h1>
            <p className="text-primary-600 text-sm">{date}</p>
          </div>
          <DiaryDisplay diary={diary} />
        </div>
      ) : null}
    </PageShell>
  );
}

export default StudentDiary;
