import { FinalReveal, type WinnerHighlight } from "../../components/FinalReveal";
import type { PodiumEntry } from "../../components/Podium";
import type { MimicaProps } from "./MimicaGame";

export function Final({ s, isHost, act, player }: MimicaProps) {
  const entries: PodiumEntry[] = Object.entries(s.totals)
    .map(([id, score]) => ({ player: player(id)!, score }))
    .filter((e) => e.player)
    .sort((a, b) => b.score - a.score);

  const id = entries[0]?.player.id;
  const guessed = id ? (s.guessed?.[id] ?? 0) : 0;
  const mimed = id ? (s.turns[id] ?? 0) : 0;
  const fastest = id ? s.fastest?.[id] : undefined;
  const highlight: WinnerHighlight | null = id
    ? {
        label: "Na mímica",
        title: `Acertou ${guessed} · imitou ${mimed}`,
        chips: fastest !== undefined ? [`Acerto mais rápido: ${fastest}s`] : [],
      }
    : null;

  return (
    <FinalReveal
      entries={entries}
      subtitle={`${s.config.rounds} ${s.config.rounds === 1 ? "rodada" : "rodadas"} de mímica`}
      highlight={highlight}
      isHost={isHost}
      onRestart={() => act({ type: "restart" })}
    />
  );
}
