import type { ScheduleEntry } from 'shared/types/diary';

interface CurriculumEditorProps {
  entries: ScheduleEntry[];
  onUpdate: (index: number, field: keyof ScheduleEntry, value: string) => void;
  onRemove: (index: number) => void;
  onAdd?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  emptyMessage?: string;
}

export default function CurriculumEditor({
  entries,
  onUpdate,
  onRemove,
  onAdd,
  onReset,
  readOnly = false,
  emptyMessage = 'No classes found',
}: CurriculumEditorProps) {
  if (entries.length === 0) {
    return (
      <div>
        <p className="text-sm text-secondary-400 text-center py-3">{emptyMessage}</p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-sm text-primary-500 hover:text-primary-700 transition font-medium"
          >
            + Add entry
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="flex gap-2 items-center bg-secondary-50 rounded-lg p-2 text-sm"
          >
            <input
              value={entry.startTime}
              onChange={(e) => onUpdate(i, 'startTime', e.target.value)}
              className="w-16 px-2 py-1 rounded border border-secondary-200 focus:border-primary-500 focus:outline-none text-center text-secondary-700"
              placeholder="09:00"
              readOnly={readOnly}
            />
            <span className="text-secondary-300">-</span>
            <input
              value={entry.endTime}
              onChange={(e) => onUpdate(i, 'endTime', e.target.value)}
              className="w-16 px-2 py-1 rounded border border-secondary-200 focus:border-primary-500 focus:outline-none text-center text-secondary-700"
              placeholder="10:00"
              readOnly={readOnly}
            />
            <input
              value={entry.activity}
              onChange={(e) => onUpdate(i, 'activity', e.target.value)}
              className="flex-1 px-2 py-1 rounded border border-secondary-200 focus:border-primary-500 focus:outline-none text-secondary-700"
              placeholder="Activity"
              readOnly={readOnly}
            />
            <input
              value={entry.location}
              onChange={(e) => onUpdate(i, 'location', e.target.value)}
              className="w-24 px-2 py-1 rounded border border-secondary-200 focus:border-primary-500 focus:outline-none text-secondary-700"
              placeholder="Location"
              readOnly={readOnly}
            />
            {!readOnly && (
              <button
                onClick={() => onRemove(i)}
                className="text-secondary-300 hover:text-error-500 transition shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className="flex gap-3">
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-sm text-primary-500 hover:text-primary-700 transition font-medium"
            >
              + Add entry
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm text-secondary-400 hover:text-secondary-600 transition"
            >
              Reset to saved
            </button>
          )}
        </div>
      )}
    </div>
  );
}
