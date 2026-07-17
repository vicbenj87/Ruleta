import { useState } from "react";
import type { TrueFalseExercise } from "../../types";

interface Props {
  exercise: TrueFalseExercise;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

export function TrueFalse({ exercise, locked, onAnswer }: Props) {
  const [choice, setChoice] = useState<boolean | null>(null);

  function choose(val: boolean) {
    if (locked || choice !== null) return;
    setChoice(val);
    onAnswer(val === exercise.isTrue);
  }

  const sentence = exercise.tokens.map((t) => t.display).join(" ");

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-violet-50 p-6 text-center text-xl font-medium leading-relaxed text-slate-800 shadow-inner sm:text-2xl">
        “{sentence}”
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => choose(true)}
          disabled={locked || choice !== null}
          className={`rounded-2xl border-4 px-8 py-4 text-xl font-extrabold shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 ${
            choice === true
              ? exercise.isTrue
                ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                : "border-rose-500 bg-rose-100 text-rose-700"
              : locked && exercise.isTrue
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-emerald-300 bg-white text-emerald-600"
          }`}
        >
          ✅ Verdadero
        </button>
        <button
          onClick={() => choose(false)}
          disabled={locked || choice !== null}
          className={`rounded-2xl border-4 px-8 py-4 text-xl font-extrabold shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 ${
            choice === false
              ? !exercise.isTrue
                ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                : "border-rose-500 bg-rose-100 text-rose-700"
              : locked && !exercise.isTrue
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-rose-300 bg-white text-rose-600"
          }`}
        >
          ❌ Falso
        </button>
      </div>
    </div>
  );
}
