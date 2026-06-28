'use client';

import { Panel } from '@/components/ui/Panel';
import { CERTIFICATIONS } from '@arc/plugin-automata';

export function CertificationsPanel({ earned }: { earned: readonly string[] }) {
  const earnedSet = new Set(earned);
  return (
    <Panel className="p-6">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Certification Archive
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {CERTIFICATIONS.map((cert) => {
          const isEarned = earnedSet.has(cert.id);
          return (
            <li
              key={cert.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                isEarned
                  ? 'border-accept/40 bg-accept/5 text-ink-hi'
                  : 'border-ink-low/15 text-ink-low'
              }`}
            >
              <span>{cert.label}</span>
              <span className="text-[11px] uppercase tracking-wider">
                {isEarned ? 'Certified' : `${cert.requiredMissionIds.length} missions`}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
