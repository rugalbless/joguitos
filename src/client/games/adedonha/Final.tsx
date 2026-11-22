import type { RoundSummary } from "../../../shared/games/adedonha";
import { FinalReveal, type WinnerHighlight } from "../../components/FinalReveal";
import type { PodiumEntry } from "../../components/Podium";
import type { AdedonhaProps } from "./AdedonhaGame";

export function Final({ s, isHost, act, player }: AdedonhaProps) {
  const entries: PodiumEntry[] = Object.entries(s.totals)
    .map(([id, score]) => ({ player: player(id)!, score }))
    .filter((e) => e.player)
    .sort((a, b) => b.score - a.score);

  return (
    <FinalReveal
      entries={entries}
      subtitle={`${s.config.rounds} ${s.config.rounds === 1 ? "rodada" : "rodadas"} · letras ${s.usedLetters.join(", ")}`}
      highlight={bestRound(s.history ?? [], entries[0]?.player.id)}
      isHost={isHost}
      onRestart={() => act({ type: "restart" })}
    />
  );
}

function bestRound(history: RoundSummary[], id: string | undefined): WinnerHighlight | null {
  if (!id) return null;
  let best: RoundSummary | null = null;
  for (const r of history) if (!best || (r.points[id] ?? 0) > (best.points[id] ?? 0)) best = r;
  if (!best) return null;
  return {
    label: "Melhor rodada",
    title: `Rodada ${best.round} · letra ${best.letter} · +${best.points[id] ?? 0}`,
    chips: best.highlights[id] ?? [],
  };
}
