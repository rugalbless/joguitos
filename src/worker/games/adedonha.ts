import {
  ADEDONHA_DEFAULT_CATEGORIES,
  ADEDONHA_LETTERS,
  ADEDONHA_LIMITS as L,
  type AdedonhaAction,
  type AdedonhaState,
  type AnswerResult,
  rejectionKey,
  scoreCategory,
} from "../../shared/games/adedonha";
import type { GameContext, ServerGame } from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));

export const adedonha: ServerGame<AdedonhaState, AdedonhaAction> = {
  setup() {
    return freshState({ categories: [...ADEDONHA_DEFAULT_CATEGORIES], custom: [], rounds: L.defaultRounds });
  },

  action(s, me, a, ctx) {
    const isHost = ctx.hostId === me;
    const plays = s.participants.includes(me);
    s.passed ??= {}; // salas salvas antes do "Não sei" existir

    switch (a.type) {
      // ---------- configuração ----------
      case "toggle-category": {
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        const i = s.config.categories.indexOf(a.name);
        if (i >= 0) {
          if (s.config.categories.length <= L.minCategories) return "Precisa ter pelo menos uma categoria.";
          s.config.categories.splice(i, 1);
        } else {
          if (s.config.categories.length >= L.maxCategories) return `No máximo ${L.maxCategories} categorias.`;
          s.config.categories.push(a.name);
        }
        s.ready = [];
        return;
      }
      case "add-category": {
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        const name = a.name.trim().replace(/\s+/g, " ").slice(0, L.maxCategoryLength);
        if (!name) return;
        if (s.config.categories.length >= L.maxCategories) return `No máximo ${L.maxCategories} categorias.`;
        if (s.config.categories.some((c) => c.toLowerCase() === name.toLowerCase())) return "Essa categoria já está na lista.";
        if (!s.config.custom.includes(name)) s.config.custom.push(name);
        s.config.categories.push(name);
        s.ready = [];
        return;
      }
      case "set-rounds": {
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        s.config.rounds = clamp(a.rounds, L.minRounds, L.maxRounds);
        s.ready = [];
        return;
      }
      case "ready": {
        if (s.stage !== "setup") return;
        s.ready = s.ready.filter((id) => id !== me);
        if (a.ready) s.ready.push(me);
        maybeStart(s, ctx);
        return;
      }

      // ---------- respondendo ----------
      case "answer": {
        // Aceita também durante a contagem do STOP: é quando os celulares mandam o que estava digitado.
        if ((s.stage !== "answering" && s.stage !== "stopping") || !plays) return;
        if (!(a.index >= 0 && a.index < s.config.categories.length)) return;
        const mine = s.answers[me];
        mine[a.index] = String(a.text).slice(0, L.maxAnswerLength);
        // Escreveu algo numa categoria que tinha passado: deixa de ser "Não sei".
        if (mine[a.index].trim()) s.passed[me] = (s.passed[me] ?? []).filter((i) => i !== a.index);
        updateProgress(s, me);
        return;
      }
      case "pass": {
        if ((s.stage !== "answering" && s.stage !== "stopping") || !plays) return;
        if (!(a.index >= 0 && a.index < s.config.categories.length)) return;
        const list = (s.passed[me] ?? []).filter((i) => i !== a.index);
        if (a.passed) {
          list.push(a.index);
          s.answers[me][a.index] = "";
        }
        s.passed[me] = list;
        updateProgress(s, me);
        return;
      }
      case "stop": {
        if (s.stage !== "answering" || !plays) return;
        if (s.progress[me] < s.config.categories.length) return "Responda ou passe todas as categorias antes de gritar STOP!";
        beginStop(s, me, ctx);
        return;
      }
      case "force-stop": {
        if (s.stage !== "answering") return;
        if (!isHost) return "Só o anfitrião encerra a rodada.";
        beginStop(s, me, ctx);
        return;
      }

      // ---------- votação ----------
      case "reject": {
        if (s.stage !== "voting" || !plays || a.target === me || !s.participants.includes(a.target)) return;
        const key = rejectionKey(s.votingIndex, a.target);
        const list = (s.rejections[key] ?? []).filter((id) => id !== me);
        if (a.reject) list.push(me);
        s.rejections[key] = list;
        s.votesDone = s.votesDone.filter((id) => id !== me); // mudou o voto: precisa confirmar de novo
        return;
      }
      case "vote-done": {
        if (s.stage !== "voting" || !plays) return;
        if (!s.votesDone.includes(me)) s.votesDone.push(me);
        maybeAdvanceVoting(s, ctx);
        return;
      }
      case "force-next": {
        if (s.stage !== "voting") return;
        if (!isHost) return "Só o anfitrião pula a votação.";
        advanceVoting(s, ctx);
        return;
      }

      // ---------- entre rodadas ----------
      case "next-round": {
        if (s.stage !== "round-results") return;
        if (!isHost) return "Só o anfitrião avança.";
        if (s.round >= s.config.rounds) s.stage = "final";
        else startRound(s, ctx);
        return;
      }
      case "restart": {
        if (s.stage !== "final") return;
        if (!isHost) return "Só o anfitrião reinicia.";
        Object.assign(s, freshState(s.config));
        return;
      }
    }
  },

  tick(s, ctx) {
    if (s.stage === "stopping" && s.stopAt !== null && ctx.now >= s.stopAt) {
      s.stage = "voting";
      s.votingIndex = 0;
      s.votesDone = [];
    }
  },

  playersChanged(s, ctx) {
    if (s.stage === "setup") maybeStart(s, ctx);
    if (s.stage === "voting") maybeAdvanceVoting(s, ctx);
  },

  view(s, me) {
    // Até o STOP, cada celular só vê as próprias respostas.
    if (s.stage === "answering" || s.stage === "stopping") {
      return {
        ...s,
        answers: s.answers[me] ? { [me]: s.answers[me] } : {},
        passed: s.passed[me] ? { [me]: s.passed[me] } : {},
      };
    }
    return s;
  },
};

function freshState(config: AdedonhaState["config"]): AdedonhaState {
  return {
    stage: "setup",
    config,
    ready: [],
    round: 0,
    letter: null,
    usedLetters: [],
    participants: [],
    answers: {},
    passed: {},
    progress: {},
    stoppedBy: null,
    stopAt: null,
    votingIndex: 0,
    rejections: {},
    votesDone: [],
    results: null,
    roundPoints: {},
    totals: {},
    history: [],
  };
}

function connectedIds(ctx: GameContext) {
  return ctx.players.filter((p) => ctx.isConnected(p.id)).map((p) => p.id);
}

function maybeStart(s: AdedonhaState, ctx: GameContext) {
  const online = connectedIds(ctx);
  if (online.length >= L.minPlayers && online.every((id) => s.ready.includes(id))) startRound(s, ctx);
}

function startRound(s: AdedonhaState, ctx: GameContext) {
  let pool = ADEDONHA_LETTERS.filter((l) => !s.usedLetters.includes(l));
  if (pool.length === 0) pool = ADEDONHA_LETTERS;
  const letter = pool[Math.floor(Math.random() * pool.length)];

  s.participants = connectedIds(ctx);
  s.round += 1;
  s.letter = letter;
  s.usedLetters.push(letter);
  s.answers = Object.fromEntries(s.participants.map((id) => [id, s.config.categories.map(() => "")]));
  s.passed = Object.fromEntries(s.participants.map((id) => [id, []]));
  s.progress = Object.fromEntries(s.participants.map((id) => [id, 0]));
  s.stoppedBy = null;
  s.stopAt = null;
  s.votingIndex = 0;
  s.rejections = {};
  s.votesDone = [];
  s.results = null;
  s.roundPoints = {};
  for (const id of s.participants) s.totals[id] ??= 0;
  s.stage = "answering";
}

/** Resolvidas = preenchidas ou marcadas como "Não sei". */
function updateProgress(s: AdedonhaState, id: string) {
  const passed = s.passed[id] ?? [];
  s.progress[id] = s.answers[id].filter((t, i) => t.trim() || passed.includes(i)).length;
}

function beginStop(s: AdedonhaState, by: string, ctx: GameContext) {
  s.stage = "stopping";
  s.stoppedBy = by;
  s.stopAt = ctx.now + L.stopCountdownMs;
  ctx.setTimer(s.stopAt);
}

function maybeAdvanceVoting(s: AdedonhaState, ctx: GameContext) {
  const voters = s.participants.filter((id) => ctx.isConnected(id));
  if (voters.every((id) => s.votesDone.includes(id))) advanceVoting(s, ctx);
}

function advanceVoting(s: AdedonhaState, ctx: GameContext) {
  s.votesDone = [];
  if (s.votingIndex < s.config.categories.length - 1) {
    s.votingIndex += 1;
  } else {
    scoreRound(s, ctx);
  }
}

function scoreRound(s: AdedonhaState, ctx: GameContext) {
  const letter = s.letter!;
  // A resposta é anulada se mais da metade dos OUTROS jogadores votar contra.
  const others = Math.max(1, s.participants.length - 1);
  const results: Record<string, AnswerResult[]> = {};
  for (const id of s.participants) results[id] = [];

  s.config.categories.forEach((_, cat) => {
    const answers = Object.fromEntries(s.participants.map((id) => [id, s.answers[id]?.[cat] ?? ""]));
    const scored = scoreCategory(answers, letter, (id) => (s.rejections[rejectionKey(cat, id)]?.length ?? 0) > others / 2);
    for (const id of s.participants) results[id][cat] = scored[id];
  });

  s.results = results;
  s.roundPoints = {};
  for (const id of s.participants) {
    const pts = results[id].reduce((sum, r) => sum + r.points, 0);
    s.roundPoints[id] = pts;
    s.totals[id] = (s.totals[id] ?? 0) + pts;
    ctx.addScore(id, pts);
  }
  (s.history ??= []).push({
    round: s.round,
    letter,
    points: { ...s.roundPoints },
    highlights: Object.fromEntries(
      s.participants.map((id) => [
        id,
        results[id].flatMap((r, cat) => (r.status === "unique" ? [s.answers[id][cat].trim()] : [])),
      ]),
    ),
  });
  s.stage = "round-results";
}
