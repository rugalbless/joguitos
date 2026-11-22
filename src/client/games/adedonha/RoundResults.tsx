import { Avatar, Button, Card, Pill, cx } from "../../components/ui";
import { Emoji } from "../../components/Emoji";
import type { AdedonhaProps } from "./AdedonhaGame";
import { STATUS_LABEL } from "./labels";

export function RoundResults({ s, meId, isHost, act, player }: AdedonhaProps) {
  const ranked = [...s.participants].sort((a, b) => (s.totals[b] ?? 0) - (s.totals[a] ?? 0));
  const last = s.round >= s.config.rounds;

  return (
    <>
      <Card className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">
          Fim da rodada {s.round} de {s.config.rounds} · letra {s.letter}
        </p>
        <h2 className="mt-1 text-3xl font-bold">Placar parcial</h2>
      </Card>

      <ol className="flex flex-col gap-2">
        {ranked.map((id, i) => {
          const p = player(id);
          return (
            <li
              key={id}
              className={cx("flex animate-pop items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2", id === meId && "ring-2 ring-accent")}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="w-6 text-center font-display text-lg text-muted">{i + 1}</span>
              <Avatar avatar={p?.avatar ?? "❔"} size="sm" online={!!p?.connected} />
              <span className="flex-1 truncate font-bold">{p?.name}</span>
              <span className="font-bold text-sage">+{s.roundPoints[id] ?? 0}</span>
              <span className="w-14 text-right font-display text-xl font-bold tabular-nums">{s.totals[id] ?? 0}</span>
            </li>
          );
        })}
      </ol>

      <Card>
        <h3 className="mb-2 text-xl font-bold">Respostas</h3>
        <div className="flex flex-col divide-y divide-line">
          {s.config.categories.map((c, cat) => (
            <details key={c} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                {c}
                <span className="text-muted transition group-open:rotate-180">▾</span>
              </summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {s.participants.map((id) => {
                  const r = s.results?.[id]?.[cat];
                  const label = r ? STATUS_LABEL[r.status] : null;
                  return (
                    <li key={id} className="flex items-center gap-2 text-sm">
                      <Avatar avatar={player(id)?.avatar ?? "❔"} size="sm" />
                      <span className="flex-1 truncate">{s.answers[id]?.[cat]?.trim() || "—"}</span>
                      {label && <Pill className={label.className}>{label.text}</Pill>}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </Card>

      {isHost ? (
        <Button size="lg" onClick={() => act({ type: "next-round" })}>
          {last ? (
            <>
              <Emoji e="🏆" /> Ver ranking final
            </>
          ) : (
            "Próxima rodada →"
          )}
        </Button>
      ) : (
        <p className="text-center text-muted">
          {last ? "Esperando o anfitrião revelar o ranking…" : "Esperando o anfitrião começar a próxima rodada…"}
        </p>
      )}
    </>
  );
}
