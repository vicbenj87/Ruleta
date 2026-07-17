import { useMemo, useState } from "react";
import type { TypeInExercise } from "../../types";

interface Props {
  exercise: TypeInExercise;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function TypeIn({ exercise, locked, onAnswer }: Props) {
  const [values, setValues] = useState<Record<number, string>>({});

  const blankMap = useMemo(() => {
    const m = new Map<number, string>();
    exercise.blanks.forEach((b) => m.set(b.tokenIndex, b.answer));
    return m;
  }, [exercise]);

  const allFilled = exercise.blanks.every((b) => (values[b.tokenIndex] ?? "").trim().length > 0);

  function submit() {
    if (locked) return;
    const correct = exercise.blanks.every(
      (b) => normalize(values[b.tokenIndex] ?? "") === normalize(b.answer)
    );
    onAnswer(correct);
  }

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-1 text-xl leading-relaxed text-slate-800 sm:text-2xl">
        {exercise.tokens.map((t) => {
          const isBlank = blankMap.has(t.index);
          if (!isBlank) {
            return <span key={t.index}>{t.display}</span>;
          }
          const answer = blankMap.get(t.index)!;
          const value = values[t.index] ?? "";
          const isCorrect = locked && normalize(value) === normalize(answer);
          const isWrong = locked && !isCorrect;
          return (
            <span key={t.index} className="inline-flex items-center gap-1">
              <input
                value={value}
                disabled={locked}
                onChange={(e) => setValues((v) => ({ ...v, [t.index]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="?"
                className={`w-24 rounded-lg border-2 px-2 py-1 text-center text-lg font-bold outline-none transition-colors sm:w-32 ${
                  isCorrect
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : isWrong
                    ? "border-rose-400 bg-rose-50 text-rose-600"
                    : "border-violet-300 bg-violet-50 text-violet-700 focus:border-violet-500"
                }`}
              />
              {isWrong && (
                <span className="rounded bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-700">
                  {t.clean}
                </span>
              )}
              {t.suffix}
            </span>
          );
        })}
      </p>

      {!locked && (
        <button
          onClick={submit}
          disabled={!allFilled}
          className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-violet-300/50 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}
