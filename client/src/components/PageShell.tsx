import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PageShellProps {
  children: ReactNode;
  variant?: 'teacher' | 'student';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  backTo?: string;
  backLabel?: string;
}

const maxWidthMap = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
};

export default function PageShell({
  children,
  variant = 'teacher',
  maxWidth = 'md',
  title,
  backTo,
  backLabel,
}: PageShellProps) {
  const { user, logout } = useAuth();

  const isTeacher = variant === 'teacher';

  return (
    <div className={`min-h-screen ${isTeacher ? 'bg-secondary-50' : 'bg-gradient-to-b from-primary-50 to-orange-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${
        isTeacher
          ? 'bg-white/90 border-secondary-200'
          : 'bg-white/80 border-primary-100'
      }`}>
        <div className={`${maxWidthMap[maxWidth]} mx-auto px-4 sm:px-6 flex items-center justify-between h-14`}>
          <div className="flex items-center gap-3 min-w-0">
            {backTo ? (
              <a
                href={backTo}
                className={`shrink-0 text-sm font-medium transition ${
                  isTeacher
                    ? 'text-secondary-500 hover:text-secondary-700'
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                <svg className="w-5 h-5 inline -mt-0.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                {backLabel || 'Back'}
              </a>
            ) : (
              <span className={`text-lg font-bold tracking-tight ${
                isTeacher ? 'text-secondary-800' : 'text-primary-700'
              }`}>
                FlowDiary
              </span>
            )}
            {title && (
              <span className="text-sm text-secondary-400 truncate hidden sm:block">
                / {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-secondary-400 hidden sm:block">
                {user.name}
              </span>
            )}
            <button
              onClick={logout}
              className="text-xs text-secondary-400 hover:text-error-500 transition font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`${maxWidthMap[maxWidth]} mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in`}>
        {children}
      </main>
    </div>
  );
}
