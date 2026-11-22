import usePartySocket from "partysocket/react";
import { useCallback, useEffect, useState } from "react";
import type { ClientMessage, RoomState, ServerMessage } from "../../shared/protocol";
import type { Profile } from "./profile";

export type ConnectionStatus = "connecting" | "open" | "closed" | "kicked";

/** Conecta na sala em tempo real. Entra automaticamente quando o perfil tem nome. */
export function useRoom(code: string, profile: Profile) {
  const [state, setState] = useState<RoomState | null>(null);
  const [game, setGame] = useState<unknown>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  const socket = usePartySocket({
    party: "room",
    room: code,
    id: profile.id,
    enabled: status !== "kicked",
    // O "join" é enviado pelo efeito abaixo sempre que a conexão (re)abre.
    onOpen() {
      setStatus("open");
    },
    onClose() {
      setStatus((s) => (s === "kicked" ? s : "closed"));
    },
    onMessage(event) {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      if (msg.type === "state") {
        setState(msg.state);
        setGame(msg.game);
      }
      else if (msg.type === "error") setError(msg.message);
      else if (msg.type === "kicked") setStatus("kicked");
    },
  });

  const send = useCallback(
    (msg: ClientMessage) => {
      setError(null);
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  // Entra (ou atualiza nome/avatar) quando o perfil muda com a conexão aberta.
  useEffect(() => {
    if (status === "open" && profile.name) {
      send({ type: "join", name: profile.name, avatar: profile.avatar });
    }
  }, [status, profile.name, profile.avatar, send]);

  // Erros somem sozinhos.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const me = state?.players.find((p) => p.id === profile.id) ?? null;
  const isHost = !!state && state.hostId === profile.id;

  /** Atalho para mandar uma ação do jogo atual. */
  const sendGame = useCallback((action: unknown) => send({ type: "game", action }), [send]);

  return { state, game, status, error, send, sendGame, me, isHost };
}

export type RoomApi = ReturnType<typeof useRoom>;
