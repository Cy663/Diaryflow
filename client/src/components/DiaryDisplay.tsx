import { useState } from 'react';
import type { Diary } from 'shared/types/diary';
import MiniMap from './MiniMap';

interface Props {
  diary: Diary;
}

function DiaryDisplay({ diary }: Props) {
  const [currentPage, setCurrentPage] = useState(0);

  const page = diary.pages[currentPage];
  const isFirst = currentPage === 0;
  const isLast = currentPage === diary.pages.length - 1;
  const hasGps = diary.gpsTrace.length > 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full overflow-hidden">
      {/* Mini-map */}
      {hasGps && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 pt-3 pb-1 h-[160px]">
          <MiniMap
            gpsTrace={diary.gpsTrace}
            currentPageIndex={currentPage}
            pages={diary.pages}
          />
        </div>
      )}

      {/* Photos */}
      {page.placesImageUrl ? (
        <div className="bg-amber-100 p-3 flex gap-2">
          <img
            src={page.imageUrl}
            alt={page.activity}
            className="flex-1 h-64 object-cover rounded-xl min-w-0"
          />
          <img
            src={page.placesImageUrl}
            alt={`${page.activity} location`}
            className="w-1/3 h-64 object-cover rounded-xl"
          />
        </div>
      ) : (
        <div className="bg-amber-100 p-3">
          <img
            src={page.imageUrl}
            alt={page.activity}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Illustration */}
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
  );
}

export default DiaryDisplay;
