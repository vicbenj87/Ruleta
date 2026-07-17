// Utilidades de aleatoriedad reutilizables

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function pickUnique<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

export function pickUniqueIndices(length: number, count: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  return pickUnique(indices, count).sort((a, b) => a - b);
}

export function randomBoolean(): boolean {
  return Math.random() < 0.5;
}
