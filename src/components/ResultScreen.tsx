import type { ExerciseResult, Verse } from "../types";

interface ResultScreenProps {
  results: ExerciseResult[];
  verse: Verse;
  onReplay: () => void;
  onNewVerse: () => void;
}

export function ResultScreen({ results, verse, onReplay, onNewVerse }: ResultScreenProps) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const pct = Math.round((correct / total) * 100);

  const message =
    pct >= 90
      ? "¡Extraordinario! Te sabes este versículo de memoria 🌟"
      : pct >= 70
      ? "¡Muy bien hecho! Sigue practicando para dominarlo 💪"
      : pct >= 40
      ? "Buen intento, repite el juego para afianzarlo 📖"
      : "¡No te rindas! La repetición es la clave para memorizar 🙏";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-4 py-10 text-center">
      <div className="w-full max-w-xl animate-card-in rounded-3xl bg-white p-8 shadow-2xl sm:p-12">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-pink-400 text-5xl shadow-lg">
          🏆
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">¡Ejercicios completados!</h1>
        <p className="mt-2 text-lg font-semibold text-violet-600">{verse.reference}</p>
        <p className="mt-1 text-sm italic text-slate-400">"{verse.text}"</p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div>
            <div className="text-4xl font-black text-emerald-500">{correct}</div>
            <div className="text-xs font-semibold uppercase text-slate-400">Correctas</div>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <div className="text-4xl font-black text-rose-400">{total - correct}</div>
            <div className="text-xs font-semibold uppercase text-slate-400">Incorrectas</div>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <div className="text-4xl font-black text-indigo-500">{pct}%</div>
            <div className="text-xs font-semibold uppercase text-slate-400">Puntaje</div>
          </div>
        </div>

        <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-6 text-base font-semibold text-slate-700">{message}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={onReplay}
            className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            🔁 Repetir este versículo
          </button>
          <button
            onClick={onNewVerse}
            className="rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            🎡 Girar la ruleta otra vez
          </button>
        </div>
      </div>
    </div>
  );
}
