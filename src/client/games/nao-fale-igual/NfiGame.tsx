import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  NFI_LIMITS as L,
  type NfiAction,
  type NfiMode,
  type NfiState,
  alive,
  nfiRanking,
} from "../../../shared/games/nao-fale-igual";
import type { Player } from "../../../shared/protocol";
import { Emoji } from "../../components/Emoji";
import { FinalReveal } from "../../components/FinalReveal";
import type { PodiumEntry } from "../../components/Podium";
import { Segmented } from "../../components/Segmented";
import { Timer } from "../../components/Timer";
import { Avatar, Button, Card, cx } from "../../components/ui";
import { playCorrect, playTick } from "../../lib/sound";
import { useCountdown } from "../../lib/useCountdown";
import type { GameScreenProps } from "..";

type Props = {
  s: NfiState;
  meId: string;
  isHost: boolean;
  act: (a: NfiAction) => void;
  player: (id: string | null | undefined) => Player | undefined;
  players: Player[];
};

export default function NfiGame({ room }: GameScreenProps) {
  const s = room.game as NfiState | null;
  if (!s) return <p className="py-20 text-center text-muted">Carregando…</p>;
  const props: Props = {
    s,
    meId: room.me?.id ?? "",
    isHost: room.isHost,
    act: room.sendGame,
    player: (id) => room.state.players.find((p) => p.id === id),
    players: room.state.players,
  };
  return (
    <div className="flex flex-col gap-4">
      {s.stage === "setup" ? (
        <Setup {...props} />
      ) : s.stage === "choosing" ? (
        <Choosing {...props} />
      ) : s.stage === "answering" ? (
        <Answering key={s.round} {...props} />
      ) : s.stage === "reveal" ? (
        <Reveal key={s.round} {...props} />
      ) : (
        <Final {...props} />
      )}
      {room.isHost && (
        <Button variant="ghost" className="self-center" onClick={() => room.send({ type: "back-to-lobby" })}>
          {s.stage === "final" ? "Voltar pro lobby" : "Encerrar e voltar pro lobby"}
        </Button>
      )}
    </div>
  );
}

/** Fileira de corações: cheios = vidas que restam. */
function Hearts({ left, total, size = "text-xl" }: { left: number; total: number; size?: string }) {
  return (
    <span className={cx("inline-flex gap-0.5", size)} aria-label={`${left} de ${total} vidas`}>
      {Array.from({ length: total }, (_, i) => (
        <Emoji key={i} e="❤️" className={cx(i >= left && "opacity-25 grayscale")} />
      ))}
    </span>
  );
}

/** Todos os jogadores com as vidas, em ordem de quem está melhor. */
function LivesBoard({ s, meId, player, mark }: Pick<Props, "s" | "meId" | "player"> & { mark?: (id: string) => ReactNode }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {nfiRanking(s).map((id) => {
        const p = player(id);
        const out = (s.lives[id] ?? 0) <= 0;
        return (
          <li key={id} className={cx("flex items-center gap-2.5", out && "opacity-45")}>
            <Avatar avatar={p?.avatar ?? "❔"} size="sm" online={!!p?.connected} />
            <span className="min-w-0 flex-1 truncate font-bold">{id === meId ? "Você" : p?.name}</span>
            {mark?.(id)}
            {out ? <span className="text-xs font-bold text-muted">fora</span> : <Hearts left={s.lives[id] ?? 0} total={s.config.lives} size="text-base" />}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------- configuração

const MODES: { id: NfiMode; emoji: string; title: string; text: string }[] = [
  { id: "maquina", emoji: "🤖", title: "Contra a máquina", text: "A máquina sorteia o tema e escolhe uma resposta em segredo. Falou igual a ela? Perde uma vida." },
  { id: "jogador", emoji: "💬", title: "Um de nós escolhe", text: "A cada rodada alguém inventa o tema e a palavra secreta. Quem falar igual perde uma vida." },
];

export function Setup({ s, isHost, act, players }: Props) {
  const online = players.filter((p) => p.connected);
  const enough = online.length >= L.minPlayers;
  return (
    <>
      <Card className="text-center">
        <p className="text-5xl">
          <Emoji e="💬" />
        </p>
        <h2 className="mt-1 text-3xl font-bold">Não Fale o Mesmo que Eu</h2>
        <p className="mt-1 text-muted">Sai um tema e todo mundo responde ao mesmo tempo. Fuja do óbvio!</p>
      </Card>

      {!isHost && <p className="-mb-1 text-center text-sm font-bold text-muted">Só o anfitrião mexe nas configurações.</p>}
      <fieldset disabled={!isHost} className="contents">
      <Card className="flex flex-col gap-2">
        <h3 className="mb-1 text-xl font-bold">Modo</h3>
        {MODES.map((m) => {
          const on = s.config.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => act({ type: "set-mode", mode: m.id })}
              aria-pressed={on}
              className={cx(
                "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.98]",
                on ? "border-accent bg-accent/10" : "border-line bg-surface-2",
              )}
            >
              <span className="text-4xl">
                <Emoji e={m.emoji} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">{m.title}</span>
                <span className="block text-xs text-muted">{m.text}</span>
              </span>
            </button>
          );
        })}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-xl font-bold">Vidas</h3>
          <Segmented
            label="Vidas"
            value={s.config.lives}
            options={L.livesOptions.map((n) => ({ id: n, label: `${n} vidas` }))}
            onChange={(lives) => act({ type: "set-lives", lives })}
          />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold">Tempo pra responder</h3>
          <Segmented
            label="Tempo"
            value={s.config.seconds}
            options={L.secondsOptions.map((n) => ({ id: n, label: `${n}s` }))}
            onChange={(seconds) => act({ type: "set-seconds", seconds })}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Rodadas no máximo</h3>
            <p className="text-xs text-muted">Acaba antes se sobrar só um.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="soft" className="w-11 px-0 text-xl" aria-label="Menos rodadas" disabled={s.config.rounds <= L.minRounds} onClick={() => act({ type: "set-rounds", rounds: s.config.rounds - 1 })}>
              −
            </Button>
            <span className="w-8 text-center font-display text-3xl font-bold tabular-nums">{s.config.rounds}</span>
            <Button variant="soft" className="w-11 px-0 text-xl" aria-label="Mais rodadas" disabled={s.config.rounds >= L.maxRounds} onClick={() => act({ type: "set-rounds", rounds: s.config.rounds + 1 })}>
              +
            </Button>
          </div>
        </div>
      </Card>
      </fieldset>

      <Card>
        <h3 className="mb-3 text-xl font-bold">Na roda</h3>
        <ul className="flex flex-wrap gap-3">
          {online.map((p) => (
            <li key={p.id} className="flex flex-col items-center gap-1">
              <Avatar avatar={p.avatar} online={p.connected} />
              <span className="max-w-16 truncate text-xs font-bold">{p.name}</span>
            </li>
          ))}
        </ul>
        {!enough && <p className="mt-3 text-sm text-muted">Precisa de pelo menos {L.minPlayers} pessoas.</p>}
      </Card>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
        {isHost ? (
          <Button size="lg" className="w-full text-2xl" disabled={!enough} onClick={() => act({ type: "start" })}>
            Começar!
          </Button>
        ) : (
          <p className="rounded-2xl bg-surface-2 p-3 text-center font-bold text-muted">Esperando o anfitrião começar…</p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- modo jogador: escolher

export function Choosing({ s, meId, isHost, act, player }: Props) {
  const chooser = player(s.chooserId);
  const [category, setCategory] = useState("");
  const [secret, setSecret] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (category.trim() && secret.trim()) act({ type: "choose", category, secret });
  }

  if (s.chooserId !== meId) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Rodada {s.round} de {s.config.rounds}
        </p>
        <span className="animate-reveal">
          <span className="block animate-glow rounded-full">{chooser && <Avatar avatar={chooser.avatar} size="xl" online={chooser.connected} />}</span>
        </span>
        <h2 className="text-3xl font-bold">{chooser?.name ?? "Alguém"} está escolhendo…</h2>
        <p className="text-muted">Vem aí um tema. Pensa em algo que ninguém vai pensar!</p>
        {isHost && (
          <Button variant="ghost" onClick={() => act({ type: "force-reveal" })}>
            Passar a vez pra outra pessoa
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Rodada {s.round} de {s.config.rounds} · sua vez
        </p>
        <h2 className="text-3xl font-bold">Você escolhe!</h2>
        <p className="text-sm text-muted">Invente um tema e escreva, em segredo, a resposta que você acha que a galera vai dar.</p>
      </div>
      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Tema (todo mundo vê)</span>
          <input
            autoFocus
            value={category}
            onChange={(e) => setCategory(e.target.value.slice(0, L.maxTextLength))}
            placeholder="Ex.: sabores de sorvete"
            className="h-14 rounded-2xl border-2 border-line bg-bg px-4 text-xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Sua palavra (segredo)</span>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value.slice(0, L.maxTextLength))}
            placeholder="Ex.: chocolate"
            autoComplete="off"
            className="h-14 rounded-2xl border-2 border-line bg-bg px-4 text-xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
          />
        </label>
      </Card>
      <Button type="submit" size="lg" className="w-full text-xl" disabled={!category.trim() || !secret.trim()}>
        Mandar o tema
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------- respondendo

export function Answering({ s, meId, isHost, act, player }: Props) {
  const left = useCountdown(s.endsAt, s.serverNow);
  const [text, setText] = useState("");
  const mine = s.answers[meId];
  const amOut = (s.lives[meId] ?? 0) <= 0 || !s.players.includes(meId);
  const amChooser = s.chooserId === meId;
  const chooser = player(s.chooserId);
  const need = alive(s).filter((id) => id !== s.chooserId && player(id)?.connected);

  function send(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) act({ type: "answer", text });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Timer left={left} total={s.config.seconds * 1000} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
            Rodada {s.round} · {s.config.mode === "maquina" ? "tema da máquina" : `tema de ${chooser?.name ?? "?"}`}
          </p>
          <p className="flex items-center gap-2 font-display text-3xl font-bold leading-tight">
            {s.categoryEmoji && <Emoji e={s.categoryEmoji} native className="shrink-0" />}
            <span className="min-w-0">{s.category}</span>
          </p>
        </div>
      </div>

      {amChooser ? (
        <Card className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Sua palavra secreta</p>
          <p className="font-display text-3xl font-bold">{s.secret}</p>
          <p className="mt-1 text-sm text-muted">Agora é torcer pra alguém falar igual!</p>
        </Card>
      ) : amOut ? (
        <Card className="text-center text-muted">Você está fora dessa. Assiste e torce!</Card>
      ) : mine ? (
        <Card className="animate-pop text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Sua resposta</p>
          <p className="font-display text-3xl font-bold">{mine}</p>
          <p className="mt-1 text-sm text-muted">Travada! Esperando a galera…</p>
        </Card>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, L.maxTextLength))}
            placeholder="Sua resposta…"
            aria-label="Sua resposta"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="send"
            className="h-16 rounded-2xl border-2 border-line bg-surface px-4 text-2xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
          />
          <Button type="submit" size="lg" className="w-full text-xl" disabled={!text.trim()}>
            Travar resposta
          </Button>
          <p className="text-center text-xs text-muted">
            {s.config.mode === "maquina" ? "Fuja da resposta mais óbvia: a máquina adora o óbvio." : `Não fale o mesmo que ${chooser?.name ?? "quem escolheu"}!`}{" "}
            Sem resposta quando o tempo acabar = perde uma vida.
          </p>
        </form>
      )}

      <Card className="bg-surface-2 p-4">
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Responderam {need.filter((id) => s.answered.includes(id)).length} de {need.length}
        </h3>
        <LivesBoard
          s={s}
          meId={meId}
          player={player}
          mark={(id) =>
            id === s.chooserId ? (
              <span className="text-xs font-bold text-muted">escolheu</span>
            ) : s.answered.includes(id) ? (
              <Emoji e="✅" className="text-lg" label="respondeu" />
            ) : null
          }
        />
      </Card>

      {isHost && (
        <Button variant="ghost" className="self-center" onClick={() => act({ type: "force-reveal" })}>
          Encerrar o tempo agora
        </Button>
      )}
    </>
  );
}

// ---------------------------------------------------------------- revelação

const SUSPENSE_MS = 1800;

export function Reveal({ s, meId, act, player }: Props) {
  const r = s.last;
  const [open, setOpen] = useState(false);
  const over = alive(s).length <= 1 || s.round >= s.config.rounds;

  useEffect(() => {
    let n = 0;
    const tick = setInterval(() => playTick(++n === 3), SUSPENSE_MS / 3);
    const t = setTimeout(() => {
      clearInterval(tick);
      setOpen(true);
      if (r?.hit.length) playTick(true);
      else playCorrect();
    }, SUSPENSE_MS);
    return () => {
      clearTimeout(t);
      clearInterval(tick);
    };
  }, [r]);

  if (!r) return null;
  const chooser = player(s.chooserId);
  const answerers = Object.keys(r.answers).concat(r.silent);

  return (
    <>
      <Card className="flex flex-col items-center gap-2 text-center">
        <span className="text-5xl">
          <Emoji e={s.config.mode === "maquina" ? "🤖" : "💬"} />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          {r.category} · {s.config.mode === "maquina" ? "a máquina escolheu" : `${chooser?.id === meId ? "você escolheu" : `${chooser?.name ?? "?"} escolheu`}`}
        </p>
        {open ? (
          <p className="animate-reveal font-display text-4xl font-bold">{r.secret}</p>
        ) : (
          <p className="animate-pulse font-display text-4xl font-bold text-muted">???</p>
        )}
      </Card>

      {open && (
        <>
          <ul className="flex flex-col gap-2">
            {answerers.map((id, i) => {
              const p = player(id);
              const hit = r.hit.includes(id);
              const silent = r.silent.includes(id);
              const lost = hit || silent;
              return (
                <li
                  key={id}
                  className={cx(
                    "flex animate-pop items-center gap-3 rounded-blob border bg-surface p-3 shadow-cozy",
                    lost ? "border-plum/50" : "border-line",
                  )}
                  style={{ animationDelay: `${0.2 + i * 0.12}s` }}
                >
                  <Avatar avatar={p?.avatar ?? "❔"} size="sm" online={!!p?.connected} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-muted">{id === meId ? "Você" : p?.name}</p>
                    <p className={cx("truncate font-display text-xl font-bold", silent && "text-muted")}>{silent ? "não respondeu" : r.answers[id]}</p>
                  </div>
                  {lost ? (
                    <span className="flex animate-[stamp_0.5s_both] items-center gap-1 font-display font-bold text-plum" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                      <Emoji e="💔" className="text-2xl" /> −1
                    </span>
                  ) : (
                    <Emoji e="✅" className="text-2xl" label="escapou" />
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-center font-display text-lg font-bold">
            {r.hit.length === 0
              ? s.config.mode === "maquina"
                ? "Ninguém caiu na da máquina!"
                : "Ninguém falou igual!"
              : `${r.hit.map((id) => (id === meId ? "Você" : player(id)?.name)).join(", ")} ${r.hit.length === 1 ? "falou" : "falaram"} igual!`}
          </p>

          <Card className="bg-surface-2 p-4">
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Vidas</h3>
            <LivesBoard s={s} meId={meId} player={player} />
          </Card>

          <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
            <Button size="lg" className="w-full text-xl" onClick={() => act({ type: "next" })}>
              {over ? (
                <>
                  <Emoji e="🏆" /> Ver ranking final
                </>
              ) : (
                "Próxima rodada →"
              )}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- final

function Final({ s, isHost, act, player }: Props) {
  const ranking = nfiRanking(s);
  const entries: PodiumEntry[] = ranking
    // Desempate: entre eliminados, quem caiu depois fica na frente.
    .map((id) => ({ player: player(id)!, score: s.lives[id] ?? 0, rank: (s.lives[id] ?? 0) * 1000 + (s.outAt[id] ?? 999) }))
    .filter((e) => e.player);
  const winnerId = ranking[0];
  // Respostas do vencedor que escaparam (as mais recentes primeiro).
  const escapes = s.history
    .filter((r) => winnerId && r.answers[winnerId] && !r.hit.includes(winnerId))
    .map((r) => r.answers[winnerId])
    .reverse();

  return (
    <FinalReveal
      entries={entries}
      unit="vidas"
      subtitle={`${s.round} ${s.round === 1 ? "rodada" : "rodadas"} · ${s.config.mode === "maquina" ? "contra a máquina" : "um de nós escolhe"}`}
      highlight={winnerId ? { label: "Fugiu do óbvio com", title: `${escapes.length} ${escapes.length === 1 ? "resposta" : "respostas"} certeira${escapes.length === 1 ? "" : "s"}`, chips: escapes } : null}
      isHost={isHost}
      onRestart={() => act({ type: "restart" })}
    />
  );
}
