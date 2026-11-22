import type { Player } from "../../shared/protocol";

/** O que a sala oferece para a lógica de um jogo. */
export type GameContext = {
  now: number;
  hostId: string | null;
  players: Player[];
  isConnected(playerId: string): boolean;
  /** Soma pontos no placar geral da sala (o da noite toda). */
  addScore(playerId: string, points: number): void;
  /** Agenda uma chamada a `tick` no horário indicado (alarme do Durable Object). */
  setTimer(at: number): void;
};

/**
 * Contrato de um jogo no servidor. O estado `S` fica só no servidor.
 * Cada celular recebe `view(state, playerId)`, então segredos nunca saem do servidor.
 * Todos os métodos podem mutar `state`.
 */
export interface ServerGame<S, A> {
  setup(ctx: GameContext): S;
  /** Retorna uma mensagem de erro para o jogador, ou nada se a ação foi aceita. */
  action(state: S, playerId: string, action: A, ctx: GameContext): string | void;
  view(state: S, playerId: string, ctx: GameContext): unknown;
  tick?(state: S, ctx: GameContext): void;
  /** Alguém entrou ou caiu. Útil para destravar esperas do tipo "todos prontos". */
  playersChanged?(state: S, ctx: GameContext): void;
}
