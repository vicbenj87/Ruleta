import { useState } from "react";
import type { RemoveIntruderExercise } from "../../types";

interface Props {
  exercise: RemoveIntruderExercise;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

export function RemoveIntruder({ exercise, locked, onAnswer }: Props) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const disabled = locked || finished;

  function handleClick(key: string, isIntruder: boolean) {
    if (disabled) return;

    if (isIntruder) {
      const newRemoved = new Set(removed);
      newRemoved.add(key);
      setRemoved(newRemoved);
      if (newRemoved.size === exercise.intruderCount) {
        setFinished(true);
        onAnswer(true);
      }
    } else {
      setWrongKey(key);
      setFinished(true);
      onAnswer(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-5 text-lg leading-loose sm:text-xl">
        {exercise.items.map((item) => {
          const isRemoved = removed.has(item.key);
          const isWrong = wrongKey === item.key;
          const revealMissed = locked && item.isIntruder && !isRemoved;
          return (
            <button
              key={item.key}
              onClick={() => handleClick(item.key, item.isIntruder)}
              disabled={disabled || isRemoved}
              className={`rounded-lg px-2 py-1 font-semibold transition-all duration-200 ${
                isRemoved
                  ? "scale-90 bg-emerald-100 text-emerald-500 line-through opacity-60"
                  : isWrong
                  ? "bg-rose-200 text-rose-700 ring-2 ring-rose-500"
                  : revealMissed
                  ? "bg-amber-200 text-amber-800 ring-2 ring-amber-500 animate-pulse"
                  : "bg-white text-slate-800 shadow-sm hover:scale-105 hover:bg-violet-50"
              }`}
            >
              {item.display}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-slate-400">
        Intrusos encontrados: {removed.size} / {exercise.intruderCount}
      </p>
    </div>
  );
}
