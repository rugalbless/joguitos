import type { Player } from "../../shared/protocol";
import { Emoji } from "./Emoji";
import { Avatar, cx } from "./ui";

const MEDALS = ["🥇", "🥈", "🥉"];

export function rankPlayers(players: Player[]) {
  return [...players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
}

export function Scoreboard({ players, meId }: { players: Player[]; meId: string }) {
  const ranked = rankPlayers(players);
  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((p, i) => (
        <li
          key={p.id}
          className={cx(
            "flex animate-pop items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2",
            p.id === meId && "ring-2 ring-accent",
          )}
        >
          <span className="w-7 text-center font-display text-lg text-muted">{MEDALS[i] ? <Emoji e={MEDALS[i]} /> : i + 1}</span>
          <Avatar avatar={p.avatar} size="sm" online={p.connected} />
          <span className="flex-1 truncate font-bold">{p.name}</span>
          <span className="font-display text-xl font-bold tabular-nums">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
