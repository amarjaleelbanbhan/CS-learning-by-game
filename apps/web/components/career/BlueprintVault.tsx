'use client';

import { Panel } from '@/components/ui/Panel';
import { BLUEPRINTS } from '@arc/plugin-automata';

const CATEGORY_LABEL: Record<string, string> = {
  tool: 'Tool',
  cosmetic: 'Cosmetic',
  lore: 'Lore',
};

export function BlueprintVault({ earned }: { earned: readonly string[] }) {
  const earnedSet = new Set(earned);
  return (
    <Panel className="p-6 bg-gradient-to-br from-panel to-elevated/40">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-ink-low">
        Blueprint Vault
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {BLUEPRINTS.map((bp) => {
          const isUnlocked = earnedSet.has(bp.id);
          return (
            <div
              key={bp.id}
              className={`relative overflow-hidden rounded-xl border p-5 text-center transition-all duration-300 ${
                isUnlocked
                  ? 'border-arc-gold/40 bg-arc-gold/5 shadow-[0_0_15px_rgba(255,194,75,0.15)]'
                  : 'border-ink-low/10 bg-void/30 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Grid backdrop for unlocked blueprints */}
              {isUnlocked && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.07] z-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,194,75,0.15) 1px, transparent 1px), linear-gradient(rgba(255,194,75,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,194,75,0.06) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 12px 12px, 12px 12px',
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-2">
                  {isUnlocked ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-arc-gold drop-shadow-[0_0_6px_rgba(255,194,75,0.5)] animate-float"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-7 w-7 text-ink-low/40"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </div>

                <div
                  className={`text-sm font-semibold tracking-wide ${
                    isUnlocked ? 'text-ink-hi' : 'text-ink-low'
                  }`}
                >
                  {isUnlocked ? bp.title : 'ENCRYPTED_BLP'}
                </div>

                <div
                  className={`mt-1 font-mono text-[9px] uppercase tracking-wider ${
                    isUnlocked ? 'text-arc-gold' : 'text-ink-low/40'
                  }`}
                >
                  {CATEGORY_LABEL[bp.category]}
                </div>

                <div className="mt-3 font-mono text-[8px] tracking-tight opacity-40 text-ink-low uppercase">
                  {isUnlocked ? 'DECRYPTED // HASH_OK' : 'RESTRICTED // CLASS_4'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
