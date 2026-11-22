import { type Connection, Server, type WSMessage } from "partyserver";
import { getGame } from "../shared/games";
import {
  type ClientMessage,
  cleanHandle,
  isValidAvatar,
  LIMITS,
  type Player,
  type RoomState,
  type ServerMessage,
} from "../shared/protocol";
import { SERVER_GAMES } from "./games";
import type { GameContext } from "./games/types";

const STATE_KEY = "state";
const GAME_KEY = "game";

// Uma instância por sala. Com hibernação ligada, o objeto "dorme" quando ninguém
// está mandando mensagem (não gasta cota grátis) e acorda chamando onStart de novo,
// por isso o estado é salvo no storage a cada mudança.
export class Room extends Server<Env> {
  static options = { hibernate: true };

  state!: RoomState;
  /** Estado privado do jogo atual (só existe para jogos com lógica no servidor). */
  game: unknown = null;

  async onStart() {
    const saved = await this.ctx.storage.get<RoomState>(STATE_KEY);
    this.state = saved ?? {
      code: this.name,
      hostId: null,
      players: [],
      phase: "lobby",
      gameId: null,
      round: 0,
    };
    this.game = (await this.ctx.storage.get(GAME_KEY)) ?? null;
  }

  onConnect(connection: Connection) {
    this.sendState(connection);
  }

  async onMessage(connection: Connection, raw: WSMessage) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return this.sendTo(connection, { type: "error", message: "Mensagem inválida." });
    }

    const error = this.handle(connection.id, msg);
    if (error) return this.sendTo(connection, { type: "error", message: error });
    await this.commit();
  }

  async onClose(connection: Connection) {
    // O mesmo jogador pode ter outra aba/conexão aberta.
    const stillHere = [...this.getConnections()].some(
      (c) => c.id === connection.id && c !== connection,
    );
    const player = this.findPlayer(connection.id);
    if (!player || stillHere) return;

    player.connected = false;
    if (this.state.hostId === player.id) {
      // Passa o "controle remoto" pra quem chegou primeiro e ainda está conectado.
      const next = this.sortedPlayers().find((p) => p.connected);
      if (next) this.state.hostId = next.id;
    }
    this.serverGame()?.playersChanged?.(this.game, this.gameContext());
    await this.commit();
  }

  async onAlarm() {
    this.serverGame()?.tick?.(this.game, this.gameContext());
    await this.commit();
  }

  /** Aplica a mensagem ao estado. Retorna uma mensagem de erro, ou nada se deu certo. */
  private handle(playerId: string, msg: ClientMessage): string | void {
    const isHost = this.state.hostId === playerId;

    switch (msg.type) {
      case "join": {
        const name = msg.name.trim().slice(0, LIMITS.maxNameLength);
        if (!name) return "Escolha um nome.";
        if (!isValidAvatar(msg.avatar)) return "Essa foto não deu certo. Tenta outra?";
        const existing = this.findPlayer(playerId);
        if (existing) {
          Object.assign(existing, { name, avatar: msg.avatar, handle: cleanHandle(msg.handle), connected: true });
        } else {
          if (this.state.players.length >= LIMITS.maxPlayers) return "A sala está cheia.";
          this.state.players.push({
            id: playerId,
            name,
            avatar: msg.avatar,
            handle: cleanHandle(msg.handle),
            score: 0,
            connected: true,
            joinedAt: Date.now(),
          });
        }
        const host = this.findPlayer(this.state.hostId);
        if (!host || !host.connected) this.state.hostId = playerId;
        this.serverGame()?.playersChanged?.(this.game, this.gameContext());
        return;
      }

      case "select-game": {
        if (!isHost) return "Só o anfitrião escolhe o jogo.";
        const game = getGame(msg.gameId);
        if (!game || game.status !== "available") return "Esse jogo ainda não está disponível.";
        this.state.gameId = game.id;
        return;
      }

      case "start": {
        if (!isHost) return "Só o anfitrião começa o jogo.";
        const game = getGame(this.state.gameId);
        if (!game) return "Escolha um jogo primeiro.";
        const online = this.state.players.filter((p) => p.connected).length;
        if (online < game.minPlayers) return `Esse jogo precisa de pelo menos ${game.minPlayers} pessoas.`;
        this.state.phase = "playing";
        this.state.round += 1;
        this.game = SERVER_GAMES[game.id]?.setup(this.gameContext()) ?? null;
        return;
      }

      case "game": {
        const sg = this.serverGame();
        if (this.state.phase !== "playing" || !sg) return;
        if (!this.findPlayer(playerId)) return "Entre na sala primeiro.";
        if (typeof msg.action !== "object" || msg.action === null) return "Ação inválida.";
        try {
          return sg.action(this.game, playerId, msg.action, this.gameContext());
        } catch (e) {
          console.error("game action failed", e);
          return "Não deu pra fazer isso.";
        }
      }

      case "end-game":
        if (!isHost) return "Só o anfitrião encerra o jogo.";
        this.state.phase = "results";
        return;

      case "back-to-lobby":
        if (!isHost) return "Só o anfitrião volta pro lobby.";
        this.state.phase = "lobby";
        this.game = null;
        return;

      case "reset-scores":
        if (!isHost) return "Só o anfitrião zera o placar.";
        for (const p of this.state.players) p.score = 0;
        return;

      case "kick": {
        if (!isHost) return "Só o anfitrião remove jogadores.";
        if (msg.playerId === playerId) return;
        this.state.players = this.state.players.filter((p) => p.id !== msg.playerId);
        for (const c of this.getConnections()) {
          if (c.id === msg.playerId) {
            this.sendTo(c, { type: "kicked" });
            c.close(4000, "kicked");
          }
        }
        this.serverGame()?.playersChanged?.(this.game, this.gameContext());
        return;
      }

      default:
        return "Ação desconhecida.";
    }
  }

  private serverGame() {
    if (this.state.phase !== "playing" || !this.game || !this.state.gameId) return undefined;
    return SERVER_GAMES[this.state.gameId];
  }

  private gameContext(): GameContext {
    return {
      now: Date.now(),
      hostId: this.state.hostId,
      players: this.state.players,
      isConnected: (id) => this.findPlayer(id)?.connected ?? false,
      addScore: (id, points) => {
        const p = this.findPlayer(id);
        if (p) p.score += points;
      },
      setTimer: (at) => {
        void this.ctx.storage.setAlarm(at);
      },
    };
  }

  private findPlayer(id: string | null): Player | undefined {
    return this.state.players.find((p) => p.id === id);
  }

  private sortedPlayers() {
    return [...this.state.players].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  private async commit() {
    await this.ctx.storage.put({ [STATE_KEY]: this.state, [GAME_KEY]: this.game });
    for (const c of this.getConnections()) this.sendState(c);
  }

  /** Cada conexão recebe a sala + a SUA visão do jogo. */
  private sendState(connection: Connection) {
    const sg = this.serverGame();
    const game = sg ? sg.view(this.game, connection.id, this.gameContext()) : null;
    this.sendTo(connection, { type: "state", state: this.state, game });
  }

  private sendTo(connection: Connection, msg: ServerMessage) {
    connection.send(JSON.stringify(msg));
  }
}
