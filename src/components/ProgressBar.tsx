interface ProgressBarProps {
  current: number;
  total: number;
  correctCount: number;
}

export function ProgressBar({ current, total, correctCount }: ProgressBarProps) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-white/90">
        <span>
          Ejercicio {current} / {total}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-emerald-300">✓ {correctCount}</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
