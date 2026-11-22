import type { AdedonhaAction, AdedonhaState } from "../../../shared/games/adedonha";
import type { Player } from "../../../shared/protocol";
import { Button } from "../../components/ui";
import { Emoji } from "../../components/Emoji";
import type { GameScreenProps } from "..";
import { Answering } from "./Answering";
import { Final } from "./Final";
import { RoundResults } from "./RoundResults";
import { Setup } from "./Setup";
import { Voting } from "./Voting";

export type AdedonhaProps = {
  s: AdedonhaState;
  meId: string;
  isHost: boolean;
  act: (a: AdedonhaAction) => void;
  player: (id: string) => Player | undefined;
  players: Player[];
};

export default function AdedonhaGame({ room }: GameScreenProps) {
  const s = room.game as AdedonhaState | null;
  if (!s) return <p className="py-20 text-center text-muted">Carregando…</p>;

  const props: AdedonhaProps = {
    s,
    meId: room.me?.id ?? "",
    isHost: room.isHost,
    act: room.sendGame,
    player: (id) => room.state.players.find((p) => p.id === id),
    players: room.state.players,
  };

  const watching = s.stage !== "setup" && s.stage !== "final" && !s.participants.includes(props.meId);

  return (
    <div className="flex flex-col gap-4">
      {watching ? (
        <div className="rounded-blob bg-surface-2 p-6 text-center">
          <p className="text-4xl">
            <Emoji e="🍿" />
          </p>
          <p className="mt-2 font-bold">Rodada em andamento. Você entra na próxima!</p>
        </div>
      ) : s.stage === "setup" ? (
        <Setup {...props} />
      ) : s.stage === "answering" || s.stage === "stopping" ? (
        // key: a cada rodada o rascunho local recomeça do zero
        <Answering key={s.round} {...props} />
      ) : s.stage === "voting" ? (
        <Voting key={`${s.round}-${s.votingIndex}`} {...props} />
      ) : s.stage === "round-results" ? (
        <RoundResults {...props} />
      ) : (
        <Final {...props} />
      )}

      {room.isHost && (
        <Button variant="ghost" className="self-center" onClick={() => room.send({ type: "back-to-lobby" })}>
          {s.stage === "final" ? "Voltar pro lobby" : "Encerrar Adedonha e voltar pro lobby"}
        </Button>
      )}
    </div>
  );
}
