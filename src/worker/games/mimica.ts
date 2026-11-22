import {
  MIMICA_CATEGORIES,
  MIMICA_LIMITS as L,
  MIMICA_POINTS,
  type MimicaAction,
  type MimicaCategoryId,
  type MimicaState,
  checkGuess,
} from "../../shared/games/mimica";
import type { GameContext, ServerGame } from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));
const ALL = MIMICA_CATEGORIES.map((c) => c.id) as MimicaCategoryId[];
const pickRandom = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export const mimica: ServerGame<MimicaState, MimicaAction> = {
  setup() {
    return freshState({ categories: [...ALL], seconds: L.defaultSeconds, rounds: L.defaultRounds, pick: "sorteio" });
  },

  action(s, me, a, ctx) {
    const isHost = ctx.hostId === me;
    const isMime = s.mimeId === me;

    switch (a.type) {
      // ---------- configuração (só o anfitrião) ----------
      case "toggle-category": {
        if (s.stage !== "setup" || !ALL.includes(a.id)) return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        const on = s.config.categories.includes(a.id);
        // Com tudo ligado ("Aleatório"), tocar numa categoria deixa só ela.
        if (s.config.categories.length === ALL.length) s.config.categories = [a.id];
        else if (on && s.config.categories.length > 1) s.config.categories = s.config.categories.filter((c) => c !== a.id);
        else if (!on) s.config.categories = [...s.config.categories, a.id];
        return;
      }
      case "all-categories":
      case "set-seconds":
      case "set-rounds":
      case "set-pick":
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião muda as configurações.";
        if (a.type === "all-categories") s.config.categories = [...ALL];
        if (a.type === "set-seconds" && (L.secondsOptions as readonly number[]).includes(a.seconds)) s.config.seconds = a.seconds;
        if (a.type === "set-rounds") s.config.rounds = clamp(a.rounds, L.minRounds, L.maxRounds);
        if (a.type === "set-pick" && (a.pick === "sorteio" || a.pick === "votacao")) s.config.pick = a.pick;
        return;
      case "start": {
        if (s.stage !== "setup") return;
        if (!isHost) return "Só o anfitrião começa.";
        if (connectedIds(ctx).length < L.minPlayers) return `Precisa de pelo menos ${L.minPlayers} pessoas.`;
        startRound(s, ctx);
        return;
      }

      // ---------- escolha do mímico ----------
      case "vote": {
        if (s.stage !== "choosing" || !ctx.isConnected(a.target)) return;
        s.votes[me] = a.target;
        maybeCloseVote(s, ctx);
        return;
      }
      case "force-pick":
        if (s.stage !== "choosing") return;
        if (!isHost) return "Só o anfitrião encerra a votação.";
        closeVote(s, ctx);
        return;

      // ---------- palavra ----------
      case "swap-word":
        if (s.stage !== "reveal" || !isMime || s.swapsLeft <= 0) return;
        s.swapsLeft -= 1;
        drawWord(s);
        return;
      case "begin":
        if (s.stage !== "reveal" || !isMime) return;
        s.stage = "playing";
        s.endsAt = ctx.now + s.config.seconds * 1000;
        s.startedAt = ctx.now;
        ctx.setTimer(s.endsAt);
        return;

      // ---------- adivinhando ----------
      case "guess": {
        if (s.stage !== "playing" || isMime || !s.word) return;
        const text = String(a.text).trim().slice(0, L.maxGuessLength);
        if (!text) return;
        // No máximo 1 chute por segundo: impede chutar milhares de palavras pelo console.
        const last = (s.guessAt ??= {})[me] ?? 0;
        if (ctx.now - last < 1000) return "Calma! Um chute por segundo.";
        s.guessAt[me] = ctx.now;
        const result = checkGuess(text, s.word);
        if (result === "right") return finishRound(s, me, ctx);
        s.guesses = [...s.guesses, { by: me, text, close: result === "close" }].slice(-L.maxGuessesShown);
        return;
      }
      case "award":
        // O mímico marca quem acertou falando em voz alta.
        if (s.stage !== "playing" || !isMime || a.playerId === me || !ctx.players.some((p) => p.id === a.playerId)) return;
        finishRound(s, a.playerId, ctx);
        return;
      case "give-up":
        if (s.stage !== "playing" && s.stage !== "reveal") return;
        if (!isMime && !isHost) return "Só o mímico ou o anfitrião pulam a rodada.";
        finishRound(s, null, ctx);
        return;

      // ---------- entre rodadas ----------
      case "next":
        if (s.stage !== "result") return;
        if (s.round >= s.config.rounds) s.stage = "final";
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
    if (s.stage === "playing" && s.endsAt !== null && ctx.now >= s.endsAt) finishRound(s, null, ctx);
  },

  playersChanged(s, ctx) {
    if (s.stage === "choosing") maybeCloseVote(s, ctx);
  },

  view(s, me, ctx) {
    const secret = (s.stage === "reveal" || s.stage === "playing") && s.mimeId !== me;
    // usedWords inclui a palavra atual e guessAt é controle interno: nada disso sai do servidor.
    const { usedWords: _used, guessAt: _guessAt, ...rest } = s;
    return { ...rest, usedWords: [], word: secret ? null : s.word, serverNow: ctx.now };
  },
};

function freshState(config: MimicaState["config"]): MimicaState {
  return {
    stage: "setup",
    config,
    round: 0,
    mimeId: null,
    turns: {},
    votes: {},
    word: null,
    category: null,
    swapsLeft: 0,
    startedAt: null,
    endsAt: null,
    guesses: [],
    winnerId: null,
    solvedIn: null,
    totals: {},
    guessed: {},
    fastest: {},
    usedWords: [],
  };
}

function connectedIds(ctx: GameContext) {
  return ctx.players.filter((p) => ctx.isConnected(p.id)).map((p) => p.id);
}

function startRound(s: MimicaState, ctx: GameContext) {
  s.round += 1;
  s.mimeId = null;
  s.votes = {};
  s.word = null;
  s.category = null;
  s.startedAt = null;
  s.endsAt = null;
  s.guesses = [];
  s.winnerId = null;
  s.solvedIn = null;
  for (const id of connectedIds(ctx)) s.totals[id] ??= 0;
  if (s.config.pick === "votacao") {
    s.stage = "choosing";
  } else {
    // Sorteio justo: entre quem imitou menos vezes.
    const online = connectedIds(ctx);
    const fewest = Math.min(...online.map((id) => s.turns[id] ?? 0));
    setMime(s, pickRandom(online.filter((id) => (s.turns[id] ?? 0) === fewest)));
  }
}

function maybeCloseVote(s: MimicaState, ctx: GameContext) {
  const online = connectedIds(ctx);
  if (online.length > 0 && online.every((id) => s.votes[id])) closeVote(s, ctx);
}

function closeVote(s: MimicaState, ctx: GameContext) {
  const online = connectedIds(ctx);
  const count = new Map<string, number>();
  for (const target of Object.values(s.votes)) if (online.includes(target)) count.set(target, (count.get(target) ?? 0) + 1);
  const top = Math.max(0, ...count.values());
  const leaders = top > 0 ? [...count].filter(([, n]) => n === top).map(([id]) => id) : online;
  setMime(s, pickRandom(leaders));
}

function setMime(s: MimicaState, id: string) {
  s.mimeId = id;
  s.turns[id] = (s.turns[id] ?? 0) + 1;
  s.swapsLeft = L.swapsPerRound;
  drawWord(s);
  s.stage = "reveal";
}

function drawWord(s: MimicaState) {
  const cats = MIMICA_CATEGORIES.filter((c) => s.config.categories.includes(c.id));
  const pool = cats.flatMap((c) => c.words.map(([w]) => ({ w: w as string, c: c.id }))).filter((x) => x.w !== s.word);
  let fresh = pool.filter((x) => !s.usedWords.includes(x.w));
  if (fresh.length === 0) {
    s.usedWords = [];
    fresh = pool;
  }
  const pick = pickRandom(fresh);
  s.word = pick.w;
  s.category = pick.c;
  s.usedWords.push(pick.w);
}

function finishRound(s: MimicaState, winnerId: string | null, ctx: GameContext) {
  s.stage = "result";
  s.winnerId = winnerId;
  s.solvedIn = winnerId && s.startedAt ? Math.round((ctx.now - s.startedAt) / 1000) : null;
  s.endsAt = null;
  if (winnerId && s.mimeId) {
    s.totals[winnerId] = (s.totals[winnerId] ?? 0) + MIMICA_POINTS.guesser;
    s.totals[s.mimeId] = (s.totals[s.mimeId] ?? 0) + MIMICA_POINTS.mime;
    ctx.addScore(winnerId, MIMICA_POINTS.guesser);
    ctx.addScore(s.mimeId, MIMICA_POINTS.mime);
    s.guessed = { ...s.guessed, [winnerId]: (s.guessed?.[winnerId] ?? 0) + 1 };
    if (s.solvedIn !== null && (s.fastest?.[winnerId] === undefined || s.solvedIn < s.fastest[winnerId]))
      s.fastest = { ...s.fastest, [winnerId]: s.solvedIn };
  }
}
