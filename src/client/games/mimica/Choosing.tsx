import { Avatar, Button, Card, cx } from "../../components/ui";
import type { MimicaProps } from "./MimicaGame";

/** Votação de quem vai imitar nesta rodada. Dá para votar em si mesmo (se oferecer). */
export function Choosing({ s, meId, isHost, act, players }: MimicaProps) {
  const online = players.filter((p) => p.connected);
  const myVote = s.votes[meId];
  const voted = online.filter((p) => s.votes[p.id]).length;
  const count = (id: string) => Object.values(s.votes).filter((v) => v === id).length;

  return (
    <>
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Rodada {s.round} de {s.config.rounds}
        </p>
        <h2 className="text-3xl font-bold">Quem vai imitar?</h2>
        <p className="text-muted">Toque em alguém. Vale votar em você mesmo!</p>
      </div>

      <Card className="p-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {online.map((p) => {
            const n = count(p.id);
            const mine = myVote === p.id;
            return (
              <li key={p.id}>
                <button
                  onClick={() => act({ type: "vote", target: p.id })}
                  aria-pressed={mine}
                  className={cx(
                    "relative flex w-full flex-col items-center gap-1 rounded-2xl p-2 transition active:scale-95",
                    mine ? "bg-accent/15 ring-2 ring-accent" : "bg-surface-2",
                  )}
                >
                  <Avatar avatar={p.avatar} size="md" online={p.connected} />
                  <span className="w-full truncate text-center text-sm font-bold">{p.id === meId ? "Eu!" : p.name}</span>
                  {n > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid size-6 animate-pop place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-ink">
                      {n}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-center text-sm font-bold text-muted">
        {voted} de {online.length} votaram
      </p>
      {isHost && (
        <Button variant="soft" className="self-center" onClick={() => act({ type: "force-pick" })}>
          Encerrar votação agora
        </Button>
      )}
    </>
  );
}
