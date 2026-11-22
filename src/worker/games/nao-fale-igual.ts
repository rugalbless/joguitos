import {
  NFI_LIMITS as L,
  NFI_PLACE_POINTS,
  NFI_THEMES,
  type NfiAction,
  type NfiState,
  alive,
  nfiRanking,
  sameAnswer,
} from "../../shared/games/nao-fale-igual";
import type { GameContext, ServerGame } from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));
const pickRandom = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export const naoFaleIgual: ServerGame<NfiState, NfiAction> = {
  setup() {
    return freshState({ mode: "maquina", lives: L.defaultLives, seconds: L.defaultSeconds, rounds: L.defaultRounds });
  },

  action(s, me, a, ctx) {
    const isHost = ctx.hostId === me;

    switch (a.type) {
      // ---------- configuração ----------
      case "set-mode":
      case "set-lives":
      case "set-seconds":
      case "set-rounds":
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        if (a.type === "set-mode" && (a.mode === "maquina" || a.mode === "jogador")) s.config.mode = a.mode;
        if (a.type === "set-lives" && (L.livesOptions as readonly number[]).includes(a.lives)) s.config.lives = a.lives;
        if (a.type === "set-seconds" && (L.secondsOptions as readonly number[]).includes(a.seconds)) s.config.seconds = a.seconds;
        if (a.type === "set-rounds") s.config.rounds = clamp(a.rounds, L.minRounds, L.maxRounds);
        return;
      case "start": {
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião começa.";
        const online = connectedIds(ctx);
        if (online.length < L.minPlayers) return `Precisa de pelo menos ${L.minPlayers} pessoas.`;
        if (s.config.mode === "jogador" && online.length < 2) return "No modo jogador precisa de pelo menos 2 pessoas.";
        s.players = online;
        s.lives = Object.fromEntries(online.map((id) => [id, s.config.lives]));
        startRound(s, ctx);
        return;
      }

      // ---------- modo jogador: escolher tema e palavra ----------
      case "choose": {
        if (s.stage !== "choosing" || s.chooserId !== me) return;
        const category = String(a.category).trim().slice(0, L.maxTextLength);
        const secret = String(a.secret).trim().slice(0, L.maxTextLength);
        if (!category || !secret) return "Preencha o tema e a sua palavra.";
        s.category = category;
        s.categoryEmoji = null;
        s.secret = secret;
        openAnswers(s, ctx);
        return;
      }

      // ---------- respondendo ----------
      case "answer": {
        if (s.stage !== "answering" || !answerers(s, ctx).includes(me) || s.answered.includes(me)) return;
        const text = String(a.text).trim().slice(0, L.maxTextLength);
        if (!text) return;
        s.answers[me] = text;
        s.answered.push(me);
        maybeReveal(s, ctx);
        return;
      }
      case "force-reveal":
        if (!isHost) return "Só o anfitrião pode fazer isso.";
        if (s.stage === "answering") reveal(s, ctx);
        // Quem ia escolher sumiu ou travou: passa a vez para outra pessoa, na mesma rodada.
        if (s.stage === "choosing") {
          s.round -= 1;
          startRound(s, ctx);
        }
        return;

      // ---------- entre rodadas ----------
      case "next":
        if (s.stage !== "reveal") return;
        if (isOver(s)) finish(s, ctx);
        else startRound(s, ctx);
        return;
      case "restart":
        if (s.stage !== "final") return;
        if (!isHost) return "Só o anfitrião reinicia.";
        Object.assign(s, freshState(s.config));
        return;
    }
  },

  tick(s, ctx) {
    if (s.stage === "answering" && s.endsAt !== null && ctx.now >= s.endsAt) reveal(s, ctx);
  },

  playersChanged(s, ctx) {
    if (s.stage === "answering") maybeReveal(s, ctx);
  },

  view(s, me, ctx) {
    const hidden = s.stage === "choosing" || s.stage === "answering";
    return {
      ...s,
      // A palavra secreta só aparece para quem a escolheu, até a revelação.
      secret: hidden && s.chooserId !== me ? null : s.secret,
      answers: hidden ? (s.answers[me] ? { [me]: s.answers[me] } : {}) : s.answers,
      serverNow: ctx.now,
    };
  },
};

function freshState(config: NfiState["config"]): NfiState {
  return {
    stage: "setup",
    config,
    round: 0,
    players: [],
    lives: {},
    outAt: {},
    chooserId: null,
    turns: {},
    category: null,
    categoryEmoji: null,
    secret: null,
    answers: {},
    answered: [],
    endsAt: null,
    usedThemes: [],
    last: null,
    history: [],
  };
}

function connectedIds(ctx: GameContext) {
  return ctx.players.filter((p) => ctx.isConnected(p.id)).map((p) => p.id);
}

/** Quem precisa responder: vivos, conectados e que não escolheram a palavra. */
function answerers(s: NfiState, ctx: GameContext) {
  return alive(s).filter((id) => ctx.isConnected(id) && id !== s.chooserId);
}

function startRound(s: NfiState, ctx: GameContext) {
  s.round += 1;
  s.answers = {};
  s.answered = [];
  s.secret = null;
  s.category = null;
  s.categoryEmoji = null;
  s.endsAt = null;
  s.chooserId = null;

  if (s.config.mode === "jogador") {
    // A vez de escolher passa por todos os vivos, começando por quem escolheu menos.
    const candidates = alive(s).filter((id) => ctx.isConnected(id));
    const fewest = Math.min(...candidates.map((id) => s.turns[id] ?? 0));
    const chooser = pickRandom(candidates.filter((id) => (s.turns[id] ?? 0) === fewest));
    s.chooserId = chooser;
    s.turns[chooser] = (s.turns[chooser] ?? 0) + 1;
    s.stage = "choosing";
    return;
  }

  // Modo máquina: tema ainda não usado, e a máquina prefere as respostas mais óbvias.
  let pool = NFI_THEMES.filter((t) => !s.usedThemes.includes(t.name));
  if (pool.length === 0) {
    s.usedThemes = [];
    pool = [...NFI_THEMES];
  }
  const theme = pickRandom(pool);
  s.usedThemes.push(theme.name);
  s.category = theme.name;
  s.categoryEmoji = theme.emoji;
  s.secret = weightedPick(theme.items);
  openAnswers(s, ctx);
}

/** Sorteio com peso: o 1º item tem muito mais chance que o último. */
function weightedPick(items: readonly string[]) {
  const weights = items.map((_, i) => (items.length - i) ** 1.6);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[0];
}

function openAnswers(s: NfiState, ctx: GameContext) {
  s.stage = "answering";
  s.endsAt = ctx.now + s.config.seconds * 1000;
  ctx.setTimer(s.endsAt);
}

function maybeReveal(s: NfiState, ctx: GameContext) {
  const need = answerers(s, ctx);
  if (need.every((id) => s.answered.includes(id))) reveal(s, ctx);
}

function reveal(s: NfiState, ctx: GameContext) {
  if (s.stage !== "answering" || !s.secret) return;
  const need = answerers(s, ctx);
  const hit = need.filter((id) => s.answers[id] && sameAnswer(s.answers[id], s.secret!));
  const silent = need.filter((id) => !s.answers[id]);
  for (const id of [...hit, ...silent]) {
    s.lives[id] = Math.max(0, (s.lives[id] ?? 0) - 1);
    if (s.lives[id] === 0) s.outAt[id] = s.round;
  }
  s.last = { round: s.round, category: s.category ?? "", secret: s.secret, hit, silent, answers: { ...s.answers } };
  s.history.push(s.last);
  s.endsAt = null;
  s.stage = "reveal";
}

function isOver(s: NfiState) {
  const left = alive(s).length;
  return left <= 1 || s.round >= s.config.rounds;
}

function finish(s: NfiState, ctx: GameContext) {
  s.stage = "final";
  nfiRanking(s).forEach((id, i) => {
    if (NFI_PLACE_POINTS[i]) ctx.addScore(id, NFI_PLACE_POINTS[i]);
  });
}
