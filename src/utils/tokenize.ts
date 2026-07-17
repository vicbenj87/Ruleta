import type { Token, Verse } from "../types";

const TOKEN_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9]+/g;

/**
 * Tokeniza la referencia completa + el texto del versículo:
 * 1. Elimina puntuación y símbolos (se tratan como separadores).
 * 2. Divide en tokens (palabras/números).
 * 3. Conserva, por cada token, los signos originales que lo siguen (suffix)
 *    para poder mostrar el texto tal como es en el original.
 */
export function tokenizeVerse(verse: Verse): Token[] {
  const full = `${verse.reference} ${verse.text}`;
  const matches = [...full.matchAll(TOKEN_REGEX)];

  return matches.map((m, i) => {
    const clean = m[0];
    const start = m.index ?? 0;
    const end = start + clean.length;
    const nextStart = i + 1 < matches.length ? matches[i + 1].index ?? full.length : full.length;
    const between = full.slice(end, nextStart);
    const suffix = between.replace(/\s/g, "");
    const type: Token["type"] = /^[0-9]+$/.test(clean) ? "number" : "word";
    return {
      index: i,
      clean,
      suffix,
      display: clean + suffix,
      type,
    };
  });
}

export function tokensToDisplayText(tokens: Token[]): string {
  return tokens.map((t) => t.display).join(" ");
}
