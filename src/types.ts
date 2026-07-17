// Tipos centrales de la aplicación de memorización de versículos

export interface Verse {
  id: string;
  book: string;
  reference: string; // Ej: "Romanos 5:1"
  text: string; // Texto del versículo con puntuación original
}

export type TokenType = "word" | "number";

export interface Token {
  index: number; // posición dentro de la secuencia completa (referencia + texto)
  clean: string; // palabra/número sin puntuación, tal como se usa en la lógica
  suffix: string; // signos de puntuación originales que siguen al token
  display: string; // clean + suffix, tal como aparece en el texto original
  type: TokenType;
}

export type ExerciseKind =
  | "type-in"
  | "multiple-choice"
  | "drag-drop"
  | "remove-intruder"
  | "true-false";

export interface ExerciseBase {
  id: number; // 1..20
  kind: ExerciseKind;
  timer: number; // 0 = sin temporizador
  title: string;
  instructions: string;
  answerSummary: string; // texto legible de la respuesta correcta, para feedback
}

export interface TypeInBlank {
  tokenIndex: number; // índice dentro de exercise.tokens
  answer: string; // respuesta esperada (clean, lowercase para comparar)
}

export interface TypeInExercise extends ExerciseBase {
  kind: "type-in";
  tokens: Token[];
  blanks: TypeInBlank[];
}

export interface MultipleChoiceExercise extends ExerciseBase {
  kind: "multiple-choice";
  tokens: Token[];
  blankIndices: number[]; // índices en tokens que están ocultos, en orden de aparición
  options: string[]; // pool de opciones mezcladas
  correctAnswers: string[]; // respuesta correcta por cada blank, en el mismo orden que blankIndices
}

export interface DragDropPiece {
  token: Token;
  originalIndex: number; // posición correcta dentro de la secuencia completa (0..n-1)
}

export interface DragDropExercise extends ExerciseBase {
  kind: "drag-drop";
  fullLength: number;
  remaining: Token[]; // tokens visibles ya compactados (mantienen su index original)
  pieces: DragDropPiece[]; // piezas a arrastrar
}

export interface IntruderToken {
  key: string;
  display: string;
  isIntruder: boolean;
}

export interface RemoveIntruderExercise extends ExerciseBase {
  kind: "remove-intruder";
  items: IntruderToken[];
  intruderCount: number;
}

export interface TrueFalseExercise extends ExerciseBase {
  kind: "true-false";
  tokens: Token[]; // secuencia completa a mostrar (con posible sustitución)
  changedIndex: number;
  isTrue: boolean;
}

export type Exercise =
  | TypeInExercise
  | MultipleChoiceExercise
  | DragDropExercise
  | RemoveIntruderExercise
  | TrueFalseExercise;

export interface ExerciseResult {
  exerciseId: number;
  correct: boolean;
  timedOut: boolean;
}
