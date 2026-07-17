import { useState } from "react";
import type { DragDropExercise } from "../../types";

interface Props {
  exercise: DragDropExercise;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

interface WorkingItem {
  id: string;
  index: number;
  display: string;
}

export function DragDrop({ exercise, locked, onAnswer }: Props) {
  const [working, setWorking] = useState<WorkingItem[]>(() =>
    exercise.remaining.map((t) => ({ id: `fixed-${t.index}`, index: t.index, display: t.display }))
  );
  const [tray, setTray] = useState<WorkingItem[]>(() =>
    exercise.pieces.map((p) => ({
      id: `piece-${p.originalIndex}`,
      index: p.originalIndex,
      display: p.token.display,
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverGap, setHoverGap] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const disabled = locked || finished;

  function placeAt(id: string, gapIndex: number) {
    const item = tray.find((t) => t.id === id);
    if (!item) return;
    const newTray = tray.filter((t) => t.id !== id);
    const newWorking = [...working.slice(0, gapIndex), item, ...working.slice(gapIndex)];
    setTray(newTray);
    setWorking(newWorking);
    setSelectedId(null);
    setHoverGap(null);

    if (newTray.length === 0) {
      const correct = newWorking.every((w, i) => w.index === i);
      setFinished(true);
      onAnswer(correct);
    }
  }

  function handleDrop(e: React.DragEvent, gapIndex: number) {
    e.preventDefault();
    if (disabled) return;
    const id = e.dataTransfer.getData("text/plain");
    if (id) placeAt(id, gapIndex);
  }

  function handleGapClick(gapIndex: number) {
    if (disabled || !selectedId) return;
    placeAt(selectedId, gapIndex);
  }

  const Gap = ({ index }: { index: number }) => (
    <span
      onDragOver={(e) => {
        e.preventDefault();
        setHoverGap(index);
      }}
      onDragLeave={() => setHoverGap((h) => (h === index ? null : h))}
      onDrop={(e) => handleDrop(e, index)}
      onClick={() => handleGapClick(index)}
      className={`mx-0.5 inline-block h-8 w-3 rounded transition-all duration-150 align-middle ${
        hoverGap === index
          ? "w-8 bg-violet-200 border-2 border-dashed border-violet-500"
          : selectedId
          ? "w-4 bg-violet-100 border border-dashed border-violet-300 cursor-pointer"
          : "w-1.5"
      }`}
    />
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center rounded-2xl bg-slate-50 p-4 text-xl leading-loose text-slate-800 sm:text-2xl">
        <Gap index={0} />
        {working.map((item, i) => {
          const isCorrect = locked && item.index === i;
          const isWrong = locked && item.index !== i;
          const isPieceOriginallyMoved = exercise.pieces.some((p) => p.originalIndex === item.index);
          return (
            <span key={item.id} className="inline-flex items-center">
              <span
                className={`rounded-md px-1 font-semibold ${
                  isPieceOriginallyMoved
                    ? isCorrect
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400"
                      : isWrong
                      ? "bg-rose-100 text-rose-600 ring-2 ring-rose-400"
                      : "bg-amber-100 text-amber-700"
                    : ""
                }`}
              >
                {item.display}
              </span>
              <Gap index={i + 1} />
            </span>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-500">Bandeja de piezas:</p>
        <div className="flex min-h-[3.5rem] flex-wrap gap-3">
          {tray.length === 0 && (
            <span className="text-sm italic text-slate-400">Todas las piezas fueron colocadas.</span>
          )}
          {tray.map((item) => (
            <div
              key={item.id}
              draggable={!disabled}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
              onClick={() => !disabled && setSelectedId((s) => (s === item.id ? null : item.id))}
              className={`cursor-grab select-none rounded-lg border-2 px-4 py-2 text-lg font-bold shadow-md transition-transform active:cursor-grabbing hover:scale-105 ${
                selectedId === item.id
                  ? "border-violet-500 bg-violet-100 text-violet-700 scale-105"
                  : "border-amber-300 bg-amber-50 text-amber-700"
              }`}
            >
              {item.display}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Consejo: arrastra la ficha hasta el hueco, o tócala y luego toca el espacio donde va.
        </p>
      </div>
    </div>
  );
}
