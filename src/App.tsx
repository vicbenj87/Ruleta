import { useState } from "react";
import type { ExerciseResult, Verse } from "./types";
import { VERSES } from "./data/verses";
import { Wheel } from "./components/Wheel";
import { ExerciseFlow } from "./components/ExerciseFlow";
import { ResultScreen } from "./components/ResultScreen";

type Screen = "wheel" | "exercises" | "result";

export default function App() {
  const [screen, setScreen] = useState<Screen>("wheel");
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [replayKey, setReplayKey] = useState(0);

  function handleVerseSelected(verse: Verse) {
    setSelectedVerse(verse);
    setReplayKey((k) => k + 1);
    setScreen("exercises");
  }

  function handleFinish(finalResults: ExerciseResult[], verse: Verse) {
    setResults(finalResults);
    setSelectedVerse(verse);
    setScreen("result");
  }

  function handleReplay() {
    setReplayKey((k) => k + 1);
    setScreen("exercises");
  }

  function handleBackToWheel() {
    setScreen("wheel");
  }

  if (screen === "exercises" && selectedVerse) {
    return (
      <ExerciseFlow
        key={replayKey}
        verse={selectedVerse}
        onFinish={handleFinish}
        onExit={handleBackToWheel}
      />
    );
  }

  if (screen === "result" && selectedVerse) {
    return (
      <ResultScreen
        results={results}
        verse={selectedVerse}
        onReplay={handleReplay}
        onNewVerse={handleBackToWheel}
      />
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-4 py-12">
      <FloatingDecor />

      <div className="relative z-10 mb-10 text-center">
        <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-bold text-amber-200 backdrop-blur">
          ✨ Memoriza la Palabra jugando ✨
        </span>
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
          Ruleta de Versículos
        </h1>
        <p className="mx-auto mt-3 max-w-md text-white/80">
          Gira la ruleta, elige tu versículo y pon a prueba tu memoria con 20 retos divertidos.
        </p>
      </div>

      <div className="relative z-10">
        <Wheel verses={VERSES} onSelect={handleVerseSelected} />
      </div>
    </div>
  );
}

function FloatingDecor() {
  const emojis = ["📖", "✨", "🙏", "⭐", "💫", "🕊️"];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {emojis.map((e, i) => (
        <span
          key={i}
          className="absolute animate-float text-3xl opacity-20 sm:text-4xl"
          style={{
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23 + 10) % 90}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${6 + i}s`,
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}
