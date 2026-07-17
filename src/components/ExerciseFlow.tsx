import { useEffect, useMemo, useRef, useState } from "react";
import type { ExerciseResult, Verse } from "../types";
import { generateExercises } from "../utils/exerciseGenerator";
import { ExerciseCard } from "./ExerciseCard";
import { ProgressBar } from "./ProgressBar";

interface ExerciseFlowProps {
  verse: Verse;
  onFinish: (results: ExerciseResult[], verse: Verse) => void;
  onExit: () => void;
}

const ADVANCE_DELAY = 2200;

export function ExerciseFlow({ verse, onFinish, onExit }: ExerciseFlowProps) {
  const exercises = useMemo(() => generateExercises(verse), [verse]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const resultsRef = useRef<ExerciseResult[]>([]);
  const answeredRef = useRef(false);
  const advanceTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const exercise = exercises[index];

  useEffect(() => {
    answeredRef.current = false;
    setFeedback(null);
    setTimeLeft(exercise.timer > 0 ? exercise.timer : null);

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (exercise.timer > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t === null) return null;
          if (t <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            handleAnswer(false, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleAnswer(correct: boolean, timedOut = false) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    resultsRef.current = [
      ...resultsRef.current,
      { exerciseId: exercise.id, correct, timedOut },
    ];
    setFeedback({ correct });
    if (correct) setCorrectCount((c) => c + 1);

    advanceTimeoutRef.current = window.setTimeout(() => {
      if (index + 1 >= exercises.length) {
        onFinish(resultsRef.current, verse);
      } else {
        setIndex((i) => i + 1);
      }
    }, ADVANCE_DELAY);
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-8">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={onExit}
          className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
        >
          ← Cambiar versículo
        </button>
        <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur">
          📖 {verse.reference}
        </div>
      </div>

      <ProgressBar current={index + 1} total={exercises.length} correctCount={correctCount} />

      <div className="flex w-full flex-1 items-center justify-center py-4">
        <ExerciseCard
          exercise={exercise}
          locked={feedback !== null}
          feedback={feedback}
          timeLeft={timeLeft}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
