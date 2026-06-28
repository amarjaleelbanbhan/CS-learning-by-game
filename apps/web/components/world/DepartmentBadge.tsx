'use client';

import { departmentPersonality } from '@/lib/world/world';

const INTENSITY_DOT: Record<string, string> = {
  calm: 'bg-arc-cyan',
  active: 'bg-arc-gold',
  volatile: 'bg-arc-violet',
};

/** Small atmosphere badge — mood + motif for a district, layered on top of its existing accent. */
export function DepartmentBadge({ districtId }: { districtId: string }) {
  const personality = departmentPersonality(districtId);
  if (!personality) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-ink-low">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${INTENSITY_DOT[personality.intensity] ?? 'bg-ink-low'}`}
      />
      <span className="capitalize">{personality.mood.join(' · ')}</span>
      <span className="text-ink-low/60">— {personality.motif}</span>
    </div>
  );
}
