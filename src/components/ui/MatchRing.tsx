interface MatchRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function MatchRing({ value, size = 48, strokeWidth = 4, className = "", label }: MatchRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = value >= 80 ? "hsl(var(--success))" : value >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-300"
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          className="fill-foreground font-semibold"
          fontSize={size * 0.28}
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {value}%
        </text>
      </svg>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
