'use client';

import { Panel } from '@/components/ui/Panel';
import { CERTIFICATIONS } from '@arc/plugin-automata';

export function CertificationsPanel({ earned }: { earned: readonly string[] }) {
  const earnedSet = new Set(earned);
  return (
    <Panel className="p-6 bg-gradient-to-br from-panel to-elevated/40">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Certification Archive
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CERTIFICATIONS.map((cert) => {
          const isEarned = earnedSet.has(cert.id);
          return (
            <div
              key={cert.id}
              className={`group relative flex items-center justify-between rounded-xl border p-4 text-sm transition-all duration-300 ${
                isEarned
                  ? 'border-accept/40 bg-accept/5 text-ink-hi shadow-accept'
                  : 'border-ink-low/15 bg-void/20 text-ink-low'
              }`}
            >
              <div className="space-y-1">
                <div className="font-display font-bold tracking-wide">{cert.label}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider opacity-60">
                  {isEarned ? 'DEPT_VERIFIED // SEC_HASH_OK' : 'SYSTEM_LOCKED // KEY_REQUIRED'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEarned ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-accept">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 drop-shadow-[0_0_4px_rgba(54,242,166,0.6)] animate-pulse"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Certified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-low/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {cert.requiredMissionIds.length} req
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
