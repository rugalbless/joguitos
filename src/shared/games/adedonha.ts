// Adedonha: tipos, regras e categorias compartilhados entre o celular e o servidor.

export const ADEDONHA_PRESETS = [
  "Nome",
  "Animal",
  "Parte do corpo humano",
  "Lugar (país, cidade, estado)",
  "Fruta",
  "Comida",
  "Objeto",
  "Cor",
  "Profissão",
  "Marca",
  "Filme ou série",
  "Cantor ou banda",
  "Time de futebol",
  "Personagem",
  "Esporte",
  "Coisa que tem na cozinha",
  "Verbo",
  "Xingamento de vó",
];

export const ADEDONHA_DEFAULT_CATEGORIES = [
  "Nome",
  "Animal",
  "Parte do corpo humano",
  "Lugar (país, cidade, estado)",
  "Fruta",
  "Objeto",
];

export const ADEDONHA_LIMITS = {
  minPlayers: 2,
  minCategories: 1,
  maxCategories: 12,
  minRounds: 1,
  maxRounds: 10,
  defaultRounds: 3,
  maxCategoryLength: 30,
  maxAnswerLength: 40,
  stopCountdownMs: 3000,
} as const;

export const POINTS = { unique: 10, repeated: 5 } as const;

// Letras difíceis (K, Q, W, X, Y, Z) ficam de fora.
export const ADEDONHA_LETTERS = "ABCDEFGHIJLMNOPRSTUV".split("");

export type AdedonhaStage = "setup" | "answering" | "stopping" | "voting" | "round-results" | "final";

export type AnswerStatus = "unique" | "repeated" | "empty" | "wrong-letter" | "rejected";

export type AnswerResult = { status: AnswerStatus; points: number };

/** Resumo de uma rodada já pontuada, usado na revelação do ranking final. */
export type RoundSummary = {
  round: number;
  letter: string;
  points: Record<string, number>;
  /** Respostas únicas (que valeram 10) de cada jogador, para mostrar no resumo da melhor rodada. */
  highlights: Record<string, string[]>;
};

export type AdedonhaState = {
  stage: AdedonhaStage;
  config: {
    categories: string[];
    custom: string[];
    rounds: number;
  };
  ready: string[];
  round: number;
  letter: string | null;
  usedLetters: string[];
  /** Quem joga a rodada atual (quem chega no meio entra na próxima). */
  participants: string[];
  /** Respostas por jogador, na ordem das categorias. Na visão do celular, só as próprias até o STOP. */
  answers: Record<string, string[]>;
  /** Categorias em que o jogador apertou "Não sei" (índices). Até o STOP, só as próprias. */
  passed: Record<string, number[]>;
  /** Quantas categorias cada jogador já resolveu, preenchendo ou passando (sempre público). */
  progress: Record<string, number>;
  stoppedBy: string | null;
  stopAt: number | null;
  votingIndex: number;
  /** `${categoria}:${jogador}` -> quem votou que a resposta NÃO vale. */
  rejections: Record<string, string[]>;
  votesDone: string[];
  results: Record<string, AnswerResult[]> | null;
  roundPoints: Record<string, number>;
  totals: Record<string, number>;
  history: RoundSummary[];
};

export type AdedonhaAction =
  | { type: "toggle-category"; name: string }
  | { type: "add-category"; name: string }
  | { type: "set-rounds"; rounds: number }
  | { type: "ready"; ready: boolean }
  | { type: "answer"; index: number; text: string }
  | { type: "pass"; index: number; passed: boolean }
  | { type: "stop" }
  | { type: "force-stop" }
  | { type: "reject"; target: string; reject: boolean }
  | { type: "vote-done" }
  | { type: "force-next" }
  | { type: "next-round" }
  | { type: "restart" };

/** "  São   Paulo! " -> "sao paulo". Usado para comparar respostas iguais e checar a letra. */
export function normalizeAnswer(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function startsWithLetter(text: string, letter: string) {
  return normalizeAnswer(text).startsWith(letter.toLowerCase());
}

export const rejectionKey = (category: number, playerId: string) => `${category}:${playerId}`;

/**
 * Pontua uma categoria. `isRejected` diz se a maioria votou contra a resposta.
 * Respostas válidas únicas valem 10. Respostas válidas que aparecem igual para mais de um jogador valem 5.
 */
export function scoreCategory(
  answers: Record<string, string>,
  letter: string,
  isRejected: (playerId: string) => boolean,
): Record<string, AnswerResult> {
  const out: Record<string, AnswerResult> = {};
  const valid: Record<string, string> = {};

  for (const [id, raw] of Object.entries(answers)) {
    const norm = normalizeAnswer(raw);
    if (!norm) out[id] = { status: "empty", points: 0 };
    else if (!norm.startsWith(letter.toLowerCase())) out[id] = { status: "wrong-letter", points: 0 };
    else if (isRejected(id)) out[id] = { status: "rejected", points: 0 };
    else valid[id] = norm;
  }

  const counts = new Map<string, number>();
  for (const norm of Object.values(valid)) counts.set(norm, (counts.get(norm) ?? 0) + 1);
  for (const [id, norm] of Object.entries(valid)) {
    out[id] =
      counts.get(norm)! > 1
        ? { status: "repeated", points: POINTS.repeated }
        : { status: "unique", points: POINTS.unique };
  }
  return out;
}
