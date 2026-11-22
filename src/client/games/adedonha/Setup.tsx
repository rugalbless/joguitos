import { type FormEvent, useState } from "react";
import { ADEDONHA_LIMITS as L, ADEDONHA_PRESETS } from "../../../shared/games/adedonha";
import { Avatar, Button, Card, cx } from "../../components/ui";
import { Emoji } from "../../components/Emoji";
import type { AdedonhaProps } from "./AdedonhaGame";

export function Setup({ s, meId, isHost, act, players }: AdedonhaProps) {
  const [custom, setCustom] = useState("");
  const all = [...ADEDONHA_PRESETS, ...s.config.custom.filter((c) => !ADEDONHA_PRESETS.includes(c))];
  const online = players.filter((p) => p.connected);
  const readyCount = online.filter((p) => s.ready.includes(p.id)).length;
  const imReady = s.ready.includes(meId);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!custom.trim()) return;
    act({ type: "add-category", name: custom });
    setCustom("");
  }

  return (
    <>
      <Card className="text-center">
        <p className="text-5xl">
          <Emoji e="🔤" />
        </p>
        <h2 className="mt-1 text-3xl font-bold">Adedonha</h2>
        <p className="mt-1 text-muted">O anfitrião escolhe as categorias e as rodadas. Quando todo mundo apertar PRONTO, começa!</p>
      </Card>

      {!isHost && <p className="-mb-1 text-center text-sm font-bold text-muted">Só o anfitrião mexe nas configurações.</p>}
      <fieldset disabled={!isHost} className="contents">
      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-xl font-bold">Categorias</h3>
          <span className="text-sm text-muted">
            {s.config.categories.length}/{L.maxCategories}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {all.map((c) => {
            const on = s.config.categories.includes(c);
            return (
              <button
                key={c}
                onClick={() => act({ type: "toggle-category", name: c })}
                aria-pressed={on}
                className={cx(
                  "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition active:scale-95",
                  on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface-2 text-muted",
                )}
              >
                {on ? "✓ " : "+ "}
                {c}
              </button>
            );
          })}
        </div>
        <form onSubmit={add} className={cx("mt-4 flex gap-2", !isHost && "hidden")}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.slice(0, L.maxCategoryLength))}
            placeholder="Inventar categoria…"
            aria-label="Nova categoria"
            className="h-11 min-w-0 flex-1 rounded-2xl border-2 border-line bg-bg px-3 font-bold outline-none focus:border-accent"
          />
          <Button type="submit" variant="soft" disabled={!custom.trim()}>
            Adicionar
          </Button>
        </form>
      </Card>

      <Card className="flex items-center justify-between gap-4">
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
      </Card>
      </fieldset>

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-xl font-bold">Quem está pronto</h3>
          <span className="text-sm text-muted">
            {readyCount}/{online.length}
          </span>
        </div>
        <ul className="flex flex-wrap gap-3">
          {online.map((p) => (
            <li key={p.id} className="flex flex-col items-center gap-1">
              <div className="relative">
                <Avatar avatar={p.avatar} online={p.connected} faded={!s.ready.includes(p.id)} />
                {s.ready.includes(p.id) && <span className="absolute -bottom-1 -right-1 animate-pop text-lg">
                    <Emoji e="✅" label="pronto" />
                  </span>}
              </div>
              <span className="max-w-16 truncate text-xs font-bold">{p.name}</span>
            </li>
          ))}
        </ul>
        {online.length < L.minPlayers && (
          <p className="mt-3 text-sm text-muted">Precisa de pelo menos {L.minPlayers} pessoas.</p>
        )}
      </Card>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
        <Button
          size="lg"
          className={cx("w-full text-2xl", imReady && "bg-sage")}
          onClick={() => act({ type: "ready", ready: !imReady })}
        >
          {imReady ? (
            <>
              <Emoji e="✅" /> PRONTO! (toque pra cancelar)
            </>
          ) : (
            "PRONTO"
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">Se o anfitrião mudar as categorias ou as rodadas, todo mundo precisa apertar PRONTO de novo.</p>
      </div>
    </>
  );
}
