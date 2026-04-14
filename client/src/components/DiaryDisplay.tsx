import { useState, useRef } from 'react';
import type { Diary } from 'shared/types/diary';
import MiniMap from './MiniMap';

interface Props {
  diary: Diary;
}

const PAGE_COLORS = [
  'bg-primary-500', 'bg-accent-500', 'bg-orange-400', 'bg-rose-400', 'bg-violet-400',
];

function DiaryDisplay({ diary }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const animKey = useRef(0);

  const page = diary.pages[currentPage];
  const isFirst = currentPage === 0;
  const isLast = currentPage === diary.pages.length - 1;
  const hasGps = diary.gpsTrace.length > 0;

  const goTo = (index: number) => {
    setDirection(index > currentPage ? 'right' : 'left');
    animKey.current++;
    setCurrentPage(index);
  };

  const animClass = direction === 'right'
    ? 'animate-slide-in-right'
    : direction === 'left'
      ? 'animate-slide-in-left'
      : '';

  return (
    <div className="font-diary bg-diary-bg rounded-3xl shadow-diary max-w-3xl w-full overflow-hidden border border-diary-border">
      {/* Mini-map */}
      {hasGps && (
        <div className="bg-primary-50/60 border-b border-diary-border px-4 pt-3 pb-1 h-[200px]">
          <MiniMap
            gpsTrace={diary.gpsTrace}
            currentPageIndex={currentPage}
            pages={diary.pages}
          />
        </div>
      )}

      {/* Page content with animation */}
      <div key={animKey.current} className={animClass}>
        {/* Photos — polaroid style (only render when images exist) */}
        {page.placesImageUrl ? (
          <div className="bg-diary-page p-5 flex gap-4 justify-center">
            <div className="diary-photo diary-photo-tilt-left flex-1 max-w-[60%]">
              <img
                src={page.imageUrl}
                alt={page.activity}
                className="w-full h-56 object-cover rounded-sm"
              />
            </div>
            <div className="diary-photo diary-photo-tilt-right w-1/3">
              <img
                src={page.placesImageUrl}
                alt={`${page.activity} location`}
                className="w-full h-56 object-cover rounded-sm"
              />
            </div>
          </div>
        ) : page.imageUrl ? (
          <div className="bg-diary-page p-5 flex justify-center">
            <div className="diary-photo max-w-lg w-full">
              <img
                src={page.imageUrl}
                alt={page.activity}
                className="w-full h-56 object-cover rounded-sm"
              />
            </div>
          </div>
        ) : null}

        {/* Illustration */}
        {page.illustrationUrl && (
          <div className="bg-primary-50/30 px-5 py-3">
            <img
              src={page.illustrationUrl}
              alt={`${page.activity} illustration`}
              className="w-full h-40 object-contain rounded-xl"
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 pt-5 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            {page.timeRange && (
              <span className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full font-semibold">
                {page.timeRange}
              </span>
            )}
            <span className="text-primary-500 text-sm font-medium">{page.activity}</span>
          </div>
          <p className="text-diary-text text-lg leading-relaxed max-w-xl mx-auto font-medium">
            {page.text}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 pb-5 pt-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-primary-600 font-semibold hover:bg-primary-100 transition disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev
        </button>

        <div className="flex gap-2">
          {diary.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i === currentPage
                  ? `${PAGE_COLORS[i % PAGE_COLORS.length]} scale-125 shadow-sm`
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={isLast}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-primary-600 font-semibold hover:bg-primary-100 transition disabled:opacity-25 disabled:hover:bg-transparent"
        >
          Next
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default DiaryDisplay;
