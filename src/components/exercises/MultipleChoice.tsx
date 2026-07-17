import { useMemo, useState } from "react";
import type { MultipleChoiceExercise } from "../../types";

interface Props {
  exercise: MultipleChoiceExercise;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function MultipleChoice({ exercise, locked, onAnswer }: Props) {
  const single = exercise.blankIndices.length === 1;

  // --- Caso de un solo espacio: 4 botones ---
  const [selected, setSelected] = useState<string | null>(null);

  function chooseSingle(option: string) {
    if (locked || selected) return;
    setSelected(option);
    onAnswer(normalize(option) === normalize(exercise.correctAnswers[0]));
  }

  // --- Caso de dos espacios: banco de fichas ---
  const [filled, setFilled] = useState<(string | null)[]>(
    () => exercise.blankIndices.map(() => null)
  );
  const [usedChips, setUsedChips] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  function chooseChip(optionIdx: number) {
    if (locked || finished || usedChips.has(optionIdx)) return;
    const slot = filled.findIndex((f) => f === null);
    if (slot === -1) return;
    const value = exercise.options[optionIdx];
    const newFilled = [...filled];
    newFilled[slot] = value;
    const newUsed = new Set(usedChips);
    newUsed.add(optionIdx);
    setFilled(newFilled);
    setUsedChips(newUsed);

    if (!newFilled.includes(null)) {
      setFinished(true);
      const correct = newFilled.every(
        (v, i) => normalize(v ?? "") === normalize(exercise.correctAnswers[i])
      );
      onAnswer(correct);
    }
  }

  const blankOrder = useMemo(() => {
    const m = new Map<number, number>();
    exercise.blankIndices.forEach((idx, order) => m.set(idx, order));
    return m;
  }, [exercise]);

  return (
    <div className="space-y-8">
      <p className="flex flex-wrap items-center gap-1 text-xl leading-relaxed text-slate-800 sm:text-2xl">
        {exercise.tokens.map((t) => {
          const order = blankOrder.get(t.index);
          if (order === undefined) {
            return <span key={t.index}>{t.display}</span>;
          }
          if (single) {
            const isCorrect = locked && normalize(selected ?? "") === normalize(exercise.correctAnswers[0]);
            return (
              <span key={t.index} className="inline-flex items-center gap-1">
                <span
                  className={`inline-flex min-w-[4.5rem] justify-center rounded-lg border-2 border-dashed px-3 py-1 font-bold ${
                    locked
                      ? isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-violet-300 bg-violet-50 text-violet-400"
                  }`}
                >
                  {selected ?? "?"}
                </span>
                {t.suffix}
              </span>
            );
          }
          const value = filled[order];
          const isCorrect = locked && normalize(value ?? "") === normalize(exercise.correctAnswers[order]);
          const showMissed = locked && !value;
          return (
            <span key={t.index} className="inline-flex items-center gap-1">
              <span
                className={`inline-flex min-w-[4.5rem] justify-center rounded-lg border-2 border-dashed px-3 py-1 font-bold ${
                  showMissed
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : value
                    ? locked
                      ? isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-violet-300 bg-violet-50 text-violet-400"
                }`}
              >
                {showMissed ? exercise.correctAnswers[order] : value ?? "?"}
              </span>
              {t.suffix}
            </span>
          );
        })}
      </p>

      {locked && !single && (
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
          Respuesta correcta: {exercise.correctAnswers.join(", ")}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {exercise.options.map((opt, i) =>
          single ? (
            <button
              key={i}
              disabled={locked || !!selected}
              onClick={() => chooseSingle(opt)}
              className={`rounded-xl border-2 px-5 py-3 text-lg font-bold shadow-sm transition-all hover:scale-105 disabled:hover:scale-100 ${
                selected === opt
                  ? normalize(opt) === normalize(exercise.correctAnswers[0])
                    ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                    : "border-rose-400 bg-rose-100 text-rose-700"
                  : locked && normalize(opt) === normalize(exercise.correctAnswers[0])
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {opt}
            </button>
          ) : (
            <button
              key={i}
              disabled={locked || usedChips.has(i)}
              onClick={() => chooseChip(i)}
              className={`rounded-xl border-2 px-5 py-3 text-lg font-bold shadow-sm transition-all hover:scale-105 disabled:cursor-not-allowed ${
                usedChips.has(i)
                  ? "border-slate-100 bg-slate-100 text-slate-300"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {opt}
            </button>
          )
        )}
      </div>
    </div>
  );
}
