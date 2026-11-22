import type { MimicaAction, MimicaState } from "../../../shared/games/mimica";
import type { Player } from "../../../shared/protocol";
import { Button } from "../../components/ui";
import type { GameScreenProps } from "..";
import { Choosing } from "./Choosing";
import { Final } from "./Final";
import { Playing } from "./Playing";
import { Result } from "./Result";
import { Reveal } from "./Reveal";
import { Setup } from "./Setup";

export type MimicaProps = {
  s: MimicaState;
  meId: string;
  isHost: boolean;
  act: (a: MimicaAction) => void;
  player: (id: string | null | undefined) => Player | undefined;
  players: Player[];
};

export default function MimicaGame({ room }: GameScreenProps) {
  const s = room.game as MimicaState | null;
  if (!s) return <p className="py-20 text-center text-muted">Carregando…</p>;

  const props: MimicaProps = {
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
      ) : s.stage === "reveal" ? (
        <Reveal key={`${s.round}`} {...props} />
      ) : s.stage === "playing" ? (
        <Playing key={`${s.round}`} {...props} />
      ) : s.stage === "result" ? (
        <Result {...props} />
      ) : (
        <Final {...props} />
      )}

      {room.isHost && (
        <Button variant="ghost" className="self-center" onClick={() => room.send({ type: "back-to-lobby" })}>
          {s.stage === "final" ? "Voltar pro lobby" : "Encerrar Mímica e voltar pro lobby"}
        </Button>
      )}
    </div>
  );
}
