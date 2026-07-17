import { useMemo, useRef, useState } from "react";
import type { Verse } from "../types";

interface WheelProps {
  verses: Verse[];
  onSelect: (verse: Verse) => void;
}

const SEGMENT_COLORS = [
  "#F97316", // orange
  "#EC4899", // pink
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#F43F5E", // rose
  "#22C55E", // green
  "#EAB308", // yellow
];

export function Wheel({ verses, onSelect }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [glow, setGlow] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const segmentAngle = 360 / verses.length;

  const gradient = useMemo(() => {
    const stops = verses.map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      const from = i * segmentAngle;
      const to = from + segmentAngle;
      return `${color} ${from}deg ${to}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [verses, segmentAngle]);

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    setGlow(false);

    const targetIndex = Math.floor(Math.random() * verses.length);
    const segmentMid = targetIndex * segmentAngle + segmentAngle / 2;
    const randomJitter = (Math.random() - 0.5) * (segmentAngle * 0.6);
    // El puntero está arriba (0deg). Para llevar el centro del segmento al puntero
    // hay que rotar la rueda -segmentMid (en sentido contrario), sumado a vueltas completas.
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6-8 vueltas
    const currentNormalized = rotation % 360;
    const targetRotation =
      rotation - currentNormalized + fullSpins * 360 + (360 - segmentMid - randomJitter);

    setRotation(targetRotation);

    const duration = 4200;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setGlow(true);
      window.setTimeout(() => {
        onSelect(verses[targetIndex]);
      }, 900);
    }, duration);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute left-1/2 -top-3 z-20 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[18px] border-t-[28px] border-x-transparent border-t-amber-400 drop-shadow-lg" />
        </div>

        <div
          className={`relative flex h-72 w-72 items-center justify-center rounded-full border-[6px] border-white shadow-2xl sm:h-96 sm:w-96 ${
            glow ? "ring-8 ring-amber-300/70 animate-pulse-slow" : ""
          }`}
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.16, 0.99)" : "none",
          }}
        >
          {verses.map((verse, i) => {
            const angle = i * segmentAngle + segmentAngle / 2;
            return (
              <div
                key={verse.id}
                className="absolute left-1/2 top-1/2 flex w-28 -translate-x-1/2 -translate-y-1/2 justify-center sm:w-36"
                style={{
                  transform: `rotate(${angle}deg) translate(0, -6.4rem) rotate(${-angle}deg)`,
                }}
              >
                <span
                  className="rounded-md bg-white/90 px-2 py-1 text-center text-[10px] font-bold leading-tight text-slate-800 shadow sm:text-xs"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  {verse.reference}
                </span>
              </div>
            );
          })}

          <div className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner sm:h-20 sm:w-20">
            <span className="text-2xl sm:text-3xl">📖</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={spinning}
        className="group relative overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-10 py-4 text-lg font-extrabold text-white shadow-lg shadow-orange-300/50 transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative z-10">{spinning ? "Girando..." : "¡Girar la ruleta!"}</span>
        <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-700 group-hover:translate-x-full" />
      </button>
    </div>
  );
}
