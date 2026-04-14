const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      <div
        className={`animate-spin rounded-full border-primary-200 border-t-primary-600 ${sizeMap[size]}`}
      />
      {label && <span className="text-sm text-secondary-500">{label}</span>}
    </div>
  );
}
