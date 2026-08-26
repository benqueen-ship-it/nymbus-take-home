import { STATUS_COLORS } from '@/utils/constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(' ', '_');
  const colors = STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.draft;

  const displayLabel = label ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {displayLabel}
    </span>
  );
}
