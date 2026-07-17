import type { Exercise } from "../types";
import { TimerRing } from "./TimerRing";
import { TypeIn } from "./exercises/TypeIn";
import { MultipleChoice } from "./exercises/MultipleChoice";
import { DragDrop } from "./exercises/DragDrop";
import { RemoveIntruder } from "./exercises/RemoveIntruder";
import { TrueFalse } from "./exercises/TrueFalse";

interface ExerciseCardProps {
  exercise: Exercise;
  locked: boolean;
  feedback: { correct: boolean } | null;
  timeLeft: number | null;
  onAnswer: (correct: boolean) => void;
}

const KIND_BADGES: Record<Exercise["kind"], { label: string; emoji: string; color: string }> = {
  "type-in": { label: "Escribir", emoji: "✍️", color: "from-violet-500 to-indigo-500" },
  "multiple-choice": { label: "Opción múltiple", emoji: "🎯", color: "from-sky-500 to-cyan-500" },
  "drag-drop": { label: "Arrastrar y soltar", emoji: "🧩", color: "from-amber-500 to-orange-500" },
  "remove-intruder": { label: "Encuentra el intruso", emoji: "🕵️", color: "from-rose-500 to-pink-500" },
  "true-false": { label: "Verdadero o falso", emoji: "⚖️", color: "from-emerald-500 to-teal-500" },
};

export function ExerciseCard({ exercise, locked, feedback, timeLeft, onAnswer }: ExerciseCardProps) {
  const badge = KIND_BADGES[exercise.kind];

  return (
    <div
      key={exercise.id}
      className="relative w-full max-w-3xl animate-card-in rounded-3xl bg-white p-6 shadow-2xl shadow-slate-400/20 sm:p-10"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${badge.color} px-3 py-1 text-xs font-bold text-white shadow`}
          >
            {badge.emoji} {badge.label}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-slate-900">{exercise.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{exercise.instructions}</p>
        </div>
        {timeLeft !== null && <TimerRing timeLeft={timeLeft} total={exercise.timer} />}
      </div>

      <div className="min-h-[10rem]">
        {exercise.kind === "type-in" && (
          <TypeIn exercise={exercise} locked={locked} onAnswer={onAnswer} />
        )}
        {exercise.kind === "multiple-choice" && (
          <MultipleChoice exercise={exercise} locked={locked} onAnswer={onAnswer} />
        )}
        {exercise.kind === "drag-drop" && (
          <DragDrop exercise={exercise} locked={locked} onAnswer={onAnswer} />
        )}
        {exercise.kind === "remove-intruder" && (
          <RemoveIntruder exercise={exercise} locked={locked} onAnswer={onAnswer} />
        )}
        {exercise.kind === "true-false" && (
          <TrueFalse exercise={exercise} locked={locked} onAnswer={onAnswer} />
        )}
      </div>

      {feedback && (
        <div
          className={`animate-slide-up pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-lg font-extrabold text-white shadow-xl sm:inset-x-8 ${
            feedback.correct ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {feedback.correct ? (
            <>🎉 ¡Correcto!</>
          ) : (
            <>
              ❌ Incorrecto — Respuesta: <span className="ml-1 underline">{exercise.answerSummary}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
