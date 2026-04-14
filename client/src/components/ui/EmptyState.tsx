import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && (
        <div className="mb-4 text-secondary-300">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-secondary-600 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-secondary-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
