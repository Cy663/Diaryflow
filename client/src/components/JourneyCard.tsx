import type { DiaryPage } from 'shared/types/diary';

const PAGE_COLORS = [
  'border-l-primary-500',
  'border-l-accent-500',
  'border-l-orange-400',
  'border-l-rose-400',
  'border-l-violet-400',
];

interface Props {
  page: DiaryPage;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function JourneyCard({ page, index, isExpanded, onToggle }: Props) {
  const borderColor = PAGE_COLORS[index % PAGE_COLORS.length];
  const hasImage = !!page.imageUrl;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left bg-diary-page rounded-2xl shadow-card hover:shadow-card-hover border border-diary-border border-l-[3px] ${borderColor} transition-all duration-200 cursor-pointer overflow-hidden`}
    >
      {/* Compact view — always visible */}
      <div className="flex items-center gap-3 p-3">
        {hasImage && (
          <img
            src={page.imageUrl}
            alt={page.activity}
            className="w-16 h-16 md:w-16 md:h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary-700 text-sm truncate">{page.activity}</p>
          {page.timeRange && (
            <span className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-semibold mt-1">
              {page.timeRange}
            </span>
          )}
          {!isExpanded && (
            <p className="text-diary-text text-xs mt-1 line-clamp-2 leading-relaxed">{page.text}</p>
          )}
        </div>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-primary-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {/* Expanded content */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {/* Full photo */}
          {hasImage && (
            <div className="px-3 pb-2">
              {page.placesImageUrl ? (
                <div className="flex gap-3 justify-center">
                  <div className="diary-photo diary-photo-tilt-left flex-1 max-w-[60%]">
                    <img
                      src={page.imageUrl}
                      alt={page.activity}
                      className="w-full h-44 object-cover rounded-sm"
                    />
                  </div>
                  <div className="diary-photo diary-photo-tilt-right w-1/3">
                    <img
                      src={page.placesImageUrl}
                      alt={`${page.activity} location`}
                      className="w-full h-44 object-cover rounded-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="diary-photo max-w-md w-full">
                    <img
                      src={page.imageUrl}
                      alt={page.activity}
                      className="w-full h-48 object-cover rounded-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full text */}
          <div className="px-4 pb-4 pt-2">
            <p className="text-diary-text text-sm leading-relaxed">{page.text}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default JourneyCard;
