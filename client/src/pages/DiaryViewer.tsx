import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import type { Diary } from 'shared/types/diary';
import { generateDiary } from '../api/diary';
import MiniMap from '../components/MiniMap';

function DiaryViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const childName = searchParams.get('name') || 'Alex';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Check if diary was passed via route state (from Create flow)
  const stateDiary = (location.state as { diary?: Diary } | null)?.diary;

  useEffect(() => {
    if (stateDiary) {
      setDiary(stateDiary);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    generateDiary({ date, childName })
      .then((res) => {
        setDiary(res.diary);
        setCurrentPage(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, childName, stateDiary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-300 border-t-amber-600 mx-auto mb-4"></div>
          <p className="text-xl text-amber-800">Generating {childName}'s diary...</p>
          <p className="text-amber-600 mt-2">Putting together today's story</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <p className="text-red-500 text-lg mb-4">Something went wrong while generating the diary</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!diary) return null;

  const page = diary.pages[currentPage];
  const isFirst = currentPage === 0;
  const isLast = currentPage === diary.pages.length - 1;
  const hasGps = diary.gpsTrace.length > 0;

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-amber-800">{diary.childName}'s Day</h1>
        <p className="text-amber-600">{diary.date}</p>
      </div>

      {/* Diary Card */}
      <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full overflow-hidden">

        {/* Mini-map - only show if GPS data exists */}
        {hasGps && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 pt-3 pb-1 h-[160px]">
            <MiniMap
              gpsTrace={diary.gpsTrace}
              currentPageIndex={currentPage}
              pages={diary.pages}
            />
          </div>
        )}

        {/* Photo */}
        <div className="bg-amber-100 p-3">
          <img
            src={page.imageUrl}
            alt={page.activity}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>

        {/* Illustration - only show if it exists */}
        {page.illustrationUrl && (
          <div className="bg-orange-50 p-3">
            <img
              src={page.illustrationUrl}
              alt={`${page.activity} illustration`}
              className="w-full h-48 object-contain rounded-xl"
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 pt-4 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {page.timeRange && (
              <span className="bg-amber-100 text-amber-700 text-sm px-3 py-1 rounded-full font-medium">
                {page.timeRange}
              </span>
            )}
            <span className="text-amber-600 text-sm">{page.activity}</span>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed max-w-xl mx-auto">{page.text}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={isFirst}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-amber-700 hover:bg-amber-100 transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <span className="text-xl">&larr;</span> Prev
          </button>

          {/* Page Dots */}
          <div className="flex gap-2">
            {diary.pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-3 h-3 rounded-full transition ${
                  i === currentPage ? 'bg-amber-500 scale-125' : 'bg-amber-200 hover:bg-amber-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={isLast}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-amber-700 hover:bg-amber-100 transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Next <span className="text-xl">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="mt-4 text-amber-600 hover:text-amber-800 transition"
      >
        &larr; Back to Home
      </button>
    </div>
  );
}

export default DiaryViewer;
