import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Diary } from 'shared/types/diary';
import { getDiary } from '../../api/diary';
import DiaryDisplay from '../../components/DiaryDisplay';
import PageShell from '../../components/PageShell';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Button from '../../components/ui/Button';

function TeacherDiary() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateDiary = (location.state as { diary?: Diary } | null)?.diary;

  useEffect(() => {
    if (stateDiary) {
      setDiary(stateDiary);
      setLoading(false);
      return;
    }
    if (!date) {
      navigate('/teacher');
      return;
    }
    getDiary(date)
      .then((res) => setDiary(res.diary))
      .catch((err) => setError(err.message === 'NOT_FOUND' ? 'No diary found for this date' : err.message))
      .finally(() => setLoading(false));
  }, [date, stateDiary, navigate]);

  return (
    <PageShell variant="teacher" maxWidth="lg" backTo="/teacher" backLabel="Dashboard" title={`Diary — ${date}`}>
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading diary..." />
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto mt-12">
          <ErrorAlert message={error} />
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => navigate('/teacher')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : diary ? (
        <div className="flex flex-col items-center">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-secondary-800">Diary Preview</h1>
            <p className="text-secondary-500 text-sm">{date}</p>
          </div>
          <DiaryDisplay diary={diary} />
        </div>
      ) : null}
    </PageShell>
  );
}

export default TeacherDiary;
