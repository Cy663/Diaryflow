import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export default function Card({ children, className = '', header, footer }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card transition-shadow hover:shadow-card-hover ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-secondary-100">{header}</div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-secondary-100">{footer}</div>
      )}
    </div>
  );
}
