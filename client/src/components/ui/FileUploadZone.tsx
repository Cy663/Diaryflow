import type { ChangeEvent, DragEvent } from 'react';
import { useState, useRef } from 'react';
import Spinner from './Spinner';

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  label: string;
  helperText?: string;
  loading?: boolean;
  loadingText?: string;
  onFiles: (files: File[]) => void;
}

export default function FileUploadZone({
  accept,
  multiple = false,
  label,
  helperText,
  loading = false,
  loadingText,
  onFiles,
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <label
      className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${dragOver
          ? 'border-primary-400 bg-primary-50'
          : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50/50'
        }
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      {loading ? (
        <Spinner size="sm" label={loadingText || 'Processing...'} />
      ) : (
        <>
          <svg className="w-8 h-8 mx-auto mb-2 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-secondary-600">{label}</p>
          {helperText && (
            <p className="text-xs text-secondary-400 mt-1">{helperText}</p>
          )}
        </>
      )}
    </label>
  );
}
