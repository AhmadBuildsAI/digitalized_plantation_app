import clsx from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  dot?: boolean;
  pulse?: boolean;
}

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-600',
  primary: 'bg-brand-accent/20 text-brand-primary',
};

export function StatusBadge({ label, variant = 'neutral', dot, pulse }: BadgeProps) {
  return (
    <span className={clsx('badge', variants[variant])}>
      {dot && (
        <span
          className={clsx(
            'w-2 h-2 rounded-full mr-1.5',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'neutral' && 'bg-gray-400',
            variant === 'primary' && 'bg-brand-accent',
            pulse && 'animate-pulse-dot'
          )}
        />
      )}
      {label}
    </span>
  );
}

export function getStatusVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    HEALTHY: 'success',
    ONLINE: 'success',
    ACTIVE: 'success',
    ON: 'success',
    WARNING: 'warning',
    MEDIUM: 'warning',
    CRITICAL: 'error',
    FAULT: 'error',
    OFFLINE: 'neutral',
    INACTIVE: 'neutral',
    OFF: 'neutral',
    LOW: 'info',
    HIGH: 'error',
  };
  return map[status] || 'neutral';
}
