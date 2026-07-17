interface TimerRingProps {
  timeLeft: number;
  total: number;
}

export function TimerRing({ timeLeft, total }: TimerRingProps) {
  const pct = Math.max(0, timeLeft / total);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const urgent = timeLeft <= 3;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={urgent ? "#ef4444" : "#f59e0b"}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${urgent ? "text-red-500 animate-ping-slow" : "text-amber-600"}`}>
        {timeLeft}
      </span>
    </div>
  );
}
