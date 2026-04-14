import { useState } from 'react';
import type { Diary } from 'shared/types/diary';
import MiniMap from './MiniMap';
import JourneyCard from './JourneyCard';

const DOT_COLORS = [
  'bg-primary-500', 'bg-accent-500', 'bg-orange-400', 'bg-rose-400', 'bg-violet-400',
];

interface Props {
  diary: Diary;
}

function DiaryDisplay({ diary }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const hasGps = diary.gpsTrace.length > 0;

  const toggleCard = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="font-diary bg-diary-bg rounded-3xl shadow-diary max-w-3xl w-full overflow-hidden border border-diary-border">
      {/* Mini-map overview */}
      {hasGps && (
        <div className="bg-primary-50/60 border-b border-diary-border px-4 pt-3 pb-1 h-[180px]">
          <MiniMap
            gpsTrace={diary.gpsTrace}
            currentPageIndex={expandedIndex ?? diary.pages.length - 1}
            pages={diary.pages}
          />
        </div>
      )}

      {/* Journey header */}
      <div className="text-center pt-5 pb-2 px-4">
        <h2 className="text-lg font-bold text-primary-700">My Journey</h2>
        <p className="text-sm text-primary-500/70">{diary.pages.length} stops today</p>
      </div>

      {/* Timeline */}
      <div className="relative px-4 sm:px-6 pb-8 pt-4">
        {/* Vertical dashed line */}
        <div className="absolute left-7 md:left-1/2 top-0 bottom-0 w-0 border-l-2 border-dashed border-primary-300/60 md:-translate-x-px" />

        {/* Cards */}
        <div className="flex flex-col gap-6 md:gap-8">
          {diary.pages.map((page, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const dotColor = DOT_COLORS[index % DOT_COLORS.length];
            const isActive = expandedIndex === index;

            return (
              <div
                key={index}
                className="relative animate-card-appear"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Dot marker on the line */}
                <div
                  className={`absolute left-7 md:left-1/2 -translate-x-1/2 top-5 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${dotColor} ${isActive ? 'journey-dot-active' : ''}`}
                />

                {/* Card — offset to side */}
                <div
                  className={`ml-14 md:ml-0 md:w-[46%] ${
                    side === 'left' ? 'md:mr-auto md:pr-6' : 'md:ml-auto md:pl-6'
                  }`}
                >
                  <JourneyCard
                    page={page}
                    index={index}
                    isExpanded={isActive}
                    onToggle={() => toggleCard(index)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DiaryDisplay;
