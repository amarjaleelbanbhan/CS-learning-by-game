'use client';

import type { Playback } from './usePlayback';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;

export function SimulationControls<T>({ pb }: { pb: Playback<T> }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconButton label="Restart" onClick={pb.restart}>
          ⟲
        </IconButton>
        <IconButton label="Step back" onClick={pb.stepBack} disabled={pb.index === 0}>
          ⏮
        </IconButton>
        <button
          onClick={pb.toggle}
          aria-label={pb.isPlaying ? 'Pause' : 'Play'}
          className="grid h-11 w-11 place-items-center rounded-full border border-arc-cyan/50 bg-arc-cyan/15 text-lg text-arc-cyan shadow-glow transition-all hover:bg-arc-cyan/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arc-cyan/60"
        >
          {pb.isPlaying ? '⏸' : '▶'}
        </button>
        <IconButton label="Step forward" onClick={pb.stepForward} disabled={pb.atEnd}>
          ⏭
        </IconButton>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-ink-low/20 p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => pb.setSpeed(s)}
              className={`rounded-md px-2 py-1 font-mono text-xs transition-colors ${
                pb.speed === s ? 'bg-arc-cyan/20 text-arc-cyan' : 'text-ink-low hover:text-ink-mid'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, pb.total - 1)}
        value={pb.index}
        onChange={(e) => pb.seek(Number(e.target.value))}
        aria-label="Timeline scrubber"
        className="arc-range w-full"
      />
      <div className="flex justify-between font-mono text-[11px] text-ink-low">
        <span>
          step {pb.index + 1} / {pb.total}
        </span>
        <span>{Math.round(pb.progress * 100)}%</span>
      </div>

      <style jsx>{`
        .arc-range {
          appearance: none;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #38e1ff ${pb.progress * 100}%,
            rgba(157, 176, 206, 0.2) ${pb.progress * 100}%
          );
          outline: none;
        }
        .arc-range::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #38e1ff;
          box-shadow: 0 0 10px rgba(56, 225, 255, 0.8);
          cursor: pointer;
        }
        .arc-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: none;
          border-radius: 999px;
          background: #38e1ff;
          box-shadow: 0 0 10px rgba(56, 225, 255, 0.8);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-ink-low/25 text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
