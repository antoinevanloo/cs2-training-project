interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'score';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

function getScoreColor(value: number): string {
  if (value >= 80) return 'bg-score-excellent';
  if (value >= 60) return 'bg-score-good';
  if (value >= 40) return 'bg-score-average';
  if (value >= 20) return 'bg-score-poor';
  return 'bg-score-bad';
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'default',
  showLabel = false,
  label,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const barColor = color === 'score' ? getScoreColor(percentage) : 'bg-cs2-accent';

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm text-gray-400">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-white">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full ${sizes[size]}`}>
        <div
          className={`${barColor} ${sizes[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'default' | 'score';
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = 'default',
  showValue = true,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColor = color === 'score'
    ? percentage >= 80
      ? '#22c55e'
      : percentage >= 60
      ? '#84cc16'
      : percentage >= 40
      ? '#eab308'
      : percentage >= 20
      ? '#f97316'
      : '#ef4444'
    : '#ff6b00';

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-gray-700"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(value)}</span>
        </div>
      )}
    </div>
  );
}
