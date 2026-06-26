'use client';

interface ArcRingProps {
  level: number;
  progress: number; // 0..1 toward next level
  size?: number;
}

/** Arc-reactor styled progress ring showing level + XP fraction. */
export function ArcRing({ level, progress, size = 46 }: ArcRingProps) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(56,225,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#38E1FF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(56,225,255,0.8))',
            transition: 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-display text-sm font-bold text-glow">{level}</span>
      </div>
    </div>
  );
}
