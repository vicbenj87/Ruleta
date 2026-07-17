import type {
  DragDropExercise,
  Exercise,
  IntruderToken,
  MultipleChoiceExercise,
  RemoveIntruderExercise,
  Token,
  TrueFalseExercise,
  TypeInExercise,
  Verse,
} from "../types";
import { FAKE_NUMBERS, FAKE_WORDS } from "../data/fakeTokens";
import { pickUnique, pickUniqueIndices, randomBoolean, shuffle } from "./random";
import { tokenizeVerse } from "./tokenize";

function fakePoolFor(type: "word" | "number"): string[] {
  return type === "word" ? FAKE_WORDS : FAKE_NUMBERS;
}

function pickFakes(type: "word" | "number", exclude: string[], count: number): string[] {
  const pool = fakePoolFor(type).filter(
    (w) => !exclude.some((e) => e.toLowerCase() === w.toLowerCase())
  );
  return pickUnique(pool, count);
}

function pickMixedFakes(excludeTokens: Token[], count: number): string[] {
  const exclude = excludeTokens.map((t) => t.clean);
  const pool = [...FAKE_WORDS, ...FAKE_NUMBERS].filter(
    (w) => !exclude.some((e) => e.toLowerCase() === w.toLowerCase())
  );
  return pickUnique(pool, count);
}

function summarizeWords(words: string[]): string {
  return words.join(", ");
}

// ---------- 1. Completar escribiendo ----------
function genTypeIn(
  tokens: Token[],
  id: number,
  timer: number,
  blanksCount: number
): TypeInExercise {
  const indices = pickUniqueIndices(tokens.length, blanksCount);
  const blanks = indices.map((idx) => ({
    tokenIndex: idx,
    answer: tokens[idx].clean.toLowerCase(),
  }));
  const answerSummary = summarizeWords(indices.map((i) => tokens[i].clean));
  return {
    id,
    kind: "type-in",
    timer,
    title:
      blanksCount === 1
        ? "Completa la palabra o número que falta"
        : `Completa las ${blanksCount} palabras o números que faltan`,
    instructions: "Escribe exactamente la palabra o número que falta en cada espacio.",
    answerSummary,
    tokens,
    blanks,
  };
}

// ---------- 2. Completar eligiendo opción ----------
function genMultipleChoice(
  tokens: Token[],
  id: number,
  timer: number,
  blanksCount: number
): MultipleChoiceExercise {
  const blankIndices = pickUniqueIndices(tokens.length, blanksCount);
  const realTokens = blankIndices.map((i) => tokens[i]);
  const correctAnswers = realTokens.map((t) => t.clean);

  let options: string[];
  if (blanksCount === 1) {
    const fakes = pickFakes(realTokens[0].type, correctAnswers, 3);
    options = shuffle([...correctAnswers, ...fakes]);
  } else {
    const fakes = pickMixedFakes(realTokens, 3);
    options = shuffle([...correctAnswers, ...fakes]);
  }

  return {
    id,
    kind: "multiple-choice",
    timer,
    title:
      blanksCount === 1
        ? "Elige la opción correcta"
        : "Elige las opciones correctas para cada espacio",
    instructions:
      blanksCount === 1
        ? "Selecciona la palabra o número que completa correctamente la frase."
        : "Toca las fichas en orden para llenar cada espacio en blanco de la frase.",
    answerSummary: summarizeWords(correctAnswers),
    tokens,
    blankIndices,
    options,
    correctAnswers,
  };
}

// ---------- 3. Arrastrar piezas ----------
function genDragDrop(
  tokens: Token[],
  id: number,
  timer: number,
  count: number
): DragDropExercise {
  const removedIdx = new Set(pickUniqueIndices(tokens.length, count));
  const remaining = tokens.filter((t) => !removedIdx.has(t.index));
  const pieces = tokens
    .filter((t) => removedIdx.has(t.index))
    .map((t) => ({ token: t, originalIndex: t.index }));

  return {
    id,
    kind: "drag-drop",
    timer,
    title: count === 1 ? "Arrastra la pieza a su lugar" : `Arrastra las ${count} piezas a su lugar`,
    instructions:
      "Arrastra cada ficha desde la bandeja hasta el hueco correcto de la frase (también puedes tocar la ficha y luego el hueco).",
    answerSummary: "El orden original de la frase",
    fullLength: tokens.length,
    remaining,
    pieces: shuffle(pieces),
  };
}

// ---------- 4. Eliminar intrusos ----------
function genRemoveIntruder(
  tokens: Token[],
  id: number,
  timer: number,
  count: number
): RemoveIntruderExercise {
  const intruderWords = pickFakes(
    "word",
    tokens.map((t) => t.clean),
    Math.min(count, FAKE_WORDS.length)
  );
  const intruderNumbers = pickFakes(
    "number",
    tokens.map((t) => t.clean),
    Math.min(count, FAKE_NUMBERS.length)
  );
  const intruderPool = shuffle([...intruderWords, ...intruderNumbers]).slice(0, count);

  const items: IntruderToken[] = tokens.map((t, i) => ({
    key: `real-${i}`,
    display: t.display,
    isIntruder: false,
  }));

  intruderPool.forEach((word, i) => {
    const insertAt = 1 + Math.floor(Math.random() * items.length);
    items.splice(insertAt, 0, {
      key: `fake-${i}-${word}`,
      display: word,
      isIntruder: true,
    });
  });

  return {
    id,
    kind: "remove-intruder",
    timer,
    title: count === 1 ? "Elimina el intruso" : `Elimina los ${count} intrusos`,
    instructions:
      count === 1
        ? "Toca el bloque que no pertenece al versículo."
        : `Toca los ${count} bloques que no pertenecen al versículo.`,
    answerSummary: summarizeWords(intruderPool),
    items,
    intruderCount: count,
  };
}

// ---------- 5. Verdadero o falso ----------
function genTrueFalse(tokens: Token[], id: number, timer: number): TrueFalseExercise {
  const idx = Math.floor(Math.random() * tokens.length);
  const original = tokens[idx];
  const isTrue = randomBoolean();

  let displayTokens = tokens;
  let usedWord = original.clean;

  if (!isTrue) {
    const [fake] = pickFakes(original.type, [original.clean], 1);
    usedWord = fake ?? original.clean;
    displayTokens = tokens.map((t, i) =>
      i === idx ? { ...t, clean: usedWord, display: usedWord + t.suffix } : t
    );
  }

  return {
    id,
    kind: "true-false",
    timer,
    title: "Verdadero o falso",
    instructions:
      "Lee la frase. Pulsa Verdadero si concuerda exactamente con el versículo, o Falso si alguna palabra fue cambiada.",
    answerSummary: isTrue
      ? "La frase es exactamente igual al versículo"
      : `Se cambió "${original.clean}" por "${usedWord}"`,
    tokens: displayTokens,
    changedIndex: idx,
    isTrue,
  };
}

export function generateExercises(verse: Verse): Exercise[] {
  const tokens = tokenizeVerse(verse);

  const exercises: Exercise[] = [
    genTypeIn(tokens, 1, 0, 1),
    genMultipleChoice(tokens, 2, 0, 1),
    genDragDrop(tokens, 3, 0, 1),
    genRemoveIntruder(tokens, 4, 0, 1),
    genTrueFalse(tokens, 5, 0),
    genTypeIn(tokens, 6, 0, 2),
    genMultipleChoice(tokens, 7, 0, 2),
    genDragDrop(tokens, 8, 0, 2),
    genRemoveIntruder(tokens, 9, 0, 2),
    genTrueFalse(tokens, 10, 0),

    genTypeIn(tokens, 11, 20, 3),
    genMultipleChoice(tokens, 12, 20, 2),
    genDragDrop(tokens, 13, 20, 3),
    genRemoveIntruder(tokens, 14, 20, 3),
    genTrueFalse(tokens, 15, 20),

    genTypeIn(tokens, 16, 10, 3),
    genMultipleChoice(tokens, 17, 10, 2),
    genDragDrop(tokens, 18, 10, 3),
    genRemoveIntruder(tokens, 19, 10, 3),
    genTrueFalse(tokens, 20, 10),
  ];

  return exercises;
}
