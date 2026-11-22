import { MIMICA_CATEGORIES, MIMICA_LIMITS as L, type MimicaPick } from "../../../shared/games/mimica";
import { Emoji } from "../../components/Emoji";
import { Segmented } from "../../components/Segmented";
import { Avatar, Button, Card, cx } from "../../components/ui";
import type { MimicaProps } from "./MimicaGame";

const PICKS: { id: MimicaPick; label: string; hint: string }[] = [
  { id: "sorteio", label: "Sorteio", hint: "Sai quem imitou menos vezes" },
  { id: "votacao", label: "Votação", hint: "A galera escolhe a cada rodada" },
];

const formatSeconds = (s: number) => (s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s / 60} min`);

export function Setup({ s, isHost, act, players }: MimicaProps) {
  const online = players.filter((p) => p.connected);
  const random = s.config.categories.length === MIMICA_CATEGORIES.length;
  const enough = online.length >= L.minPlayers;

  return (
    <>
      <Card className="text-center">
        <p className="text-5xl">
          <Emoji e="🎭" />
        </p>
        <h2 className="mt-1 text-3xl font-bold">Mímica Relâmpago</h2>
        <p className="mt-1 text-muted">Um imita sem falar nada, a galera chuta no celular. Quem acertar primeiro leva os pontos!</p>
      </Card>

      {!isHost && <p className="-mb-1 text-center text-sm font-bold text-muted">Só o anfitrião mexe nas configurações.</p>}
      <fieldset disabled={!isHost} className="contents">
      <Card>
        <h3 className="mb-3 text-xl font-bold">Categorias</h3>
        <button
          onClick={() => act({ type: "all-categories" })}
          aria-pressed={random}
          className={cx(
            "mb-2 flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition active:scale-[0.98]",
            random ? "border-accent bg-accent/10" : "border-line bg-surface-2",
          )}
        >
          <span className="text-3xl">
            <Emoji e="🎲" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-lg font-bold">Aleatório</span>
            <span className="block text-xs text-muted">Mistura tudo</span>
          </span>
          {random && <Emoji e="✅" className="text-xl" />}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {MIMICA_CATEGORIES.map((c) => {
            const on = !random && s.config.categories.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => act({ type: "toggle-category", id: c.id })}
                aria-pressed={on}
                className={cx(
                  "flex items-center gap-2 rounded-2xl border-2 px-2.5 py-2 text-left text-sm font-bold transition active:scale-95",
                  on ? "border-accent bg-accent/10 text-ink" : "border-line bg-surface-2 text-muted",
                )}
              >
                <span className="text-2xl">
                  <Emoji e={c.emoji} />
                </span>
                <span className="min-w-0 leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-xl font-bold">Tempo pra adivinhar</h3>
          <Segmented
            label="Tempo"
            value={s.config.seconds}
            options={L.secondsOptions.map((n) => ({ id: n, label: formatSeconds(n) }))}
            onChange={(seconds) => act({ type: "set-seconds", seconds })}
          />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold">Quem imita</h3>
          <Segmented label="Quem imita" value={s.config.pick} options={PICKS} onChange={(pick) => act({ type: "set-pick", pick })} />
          <p className="mt-1.5 text-center text-xs text-muted">{PICKS.find((p) => p.id === s.config.pick)?.hint}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Rodadas</h3>
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
