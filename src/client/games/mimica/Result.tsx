import { useEffect } from "react";
import { MIMICA_POINTS, getMimicaCategory, mimicaWordEmoji } from "../../../shared/games/mimica";
import { Emoji } from "../../components/Emoji";
import { Avatar, Button, Card } from "../../components/ui";
import { playCorrect } from "../../lib/sound";
import type { MimicaProps } from "./MimicaGame";

export function Result({ s, meId, act, player, players }: MimicaProps) {
  const cat = getMimicaCategory(s.category);
  const winner = player(s.winnerId);
  const mime = player(s.mimeId);
  const last = s.round >= s.config.rounds;
  const ranked = players.filter((p) => s.totals[p.id] !== undefined).sort((a, b) => (s.totals[b.id] ?? 0) - (s.totals[a.id] ?? 0));

  useEffect(() => {
    if (s.winnerId) playCorrect();
  }, [s.winnerId]);

  return (
    <>
      <Card className="flex animate-pop flex-col items-center gap-2 text-center">
        <span className="text-6xl">
          <Emoji e={mimicaWordEmoji(s.word, s.category)} native />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">A palavra era · {cat?.name}</p>
        <p className="font-display text-4xl font-bold leading-tight text-balance">{s.word}</p>
      </Card>

      {winner ? (
        <div className="flex animate-reveal flex-col items-center gap-2 text-center">
          <span className="animate-glow rounded-full">
            <Avatar avatar={winner.avatar} size="lg" online={winner.connected} />
          </span>
          <p className="font-display text-2xl font-bold">
            {winner.id === meId ? "Você acertou!" : `${winner.name} acertou!`}
          </p>
          <p className="max-w-xs text-balance text-sm text-muted">
            {s.solvedIn !== null && `Em ${s.solvedIn}s · `}
            <span className="font-bold text-sage">+{MIMICA_POINTS.guesser}</span> pra quem acertou e{" "}
            <span className="font-bold text-sage">+{MIMICA_POINTS.mime}</span> pra {mime?.id === meId ? "você, que imitou" : `${mime?.name}, que imitou`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-5xl">
            <Emoji e="🫠" />
          </span>
          <p className="font-display text-2xl font-bold">Ninguém acertou</p>
          <p className="text-sm text-muted">Sem pontos nessa rodada.</p>
        </div>
      )}

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Placar · rodada {s.round} de {s.config.rounds}
        </h3>
        <ol className="flex flex-col gap-1.5">
          {ranked.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-5 text-center font-display text-muted">{i + 1}</span>
              <Avatar avatar={p.avatar} size="sm" online={p.connected} />
              <span className="flex-1 truncate font-bold">{p.id === meId ? "Você" : p.name}</span>
              <span className="font-display text-lg font-bold tabular-nums">{s.totals[p.id] ?? 0}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
        <Button size="lg" className="w-full text-xl" onClick={() => act({ type: "next" })}>
          {last ? (
            <>
              <Emoji e="🏆" /> Ver ranking final
            </>
          ) : (
            "Próxima rodada →"
          )}
        </Button>
      </div>
    </>
  );
}
