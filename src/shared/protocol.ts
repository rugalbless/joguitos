import { isMascot } from "./mascots";
// Contrato entre o celular (client) e a sala (Durable Object).
// Toda mensagem é JSON. O servidor é a fonte da verdade: o client só envia intenções.

export type Player = {
  id: string;
  name: string;
  avatar: string;
  /** @ do Instagram (opcional, sem o "@"), para marcar no card de compartilhar o ranking. */
  handle?: string;
  score: number;
  connected: boolean;
  joinedAt: number;
};

export type Phase = "lobby" | "playing" | "results";

export type RoomState = {
  code: string;
  hostId: string | null;
  players: Player[];
  phase: Phase;
  gameId: string | null;
  round: number;
};

export type ClientMessage =
  | { type: "join"; name: string; avatar: string; handle?: string }
  | { type: "select-game"; gameId: string }
  | { type: "start" }
  | { type: "end-game" }
  | { type: "back-to-lobby" }
  | { type: "reset-scores" }
  | { type: "kick"; playerId: string }
  /** Ação específica do jogo atual. O formato é definido por cada jogo em src/shared/games/. */
  | { type: "game"; action: unknown };

export type ServerMessage =
  /** `game` é a visão do jogo atual para ESTE jogador (pode esconder segredos dos outros). */
  | { type: "state"; state: RoomState; game: unknown }
  | { type: "error"; message: string }
  | { type: "kicked" };

export const LIMITS = {
  maxPlayers: 16,
  maxNameLength: 16,
  /** Id de mascote oficial ou foto em data URL (JPEG/PNG/WebP pequeno). */
  maxAvatarLength: 16_000,
} as const;

/** Limpa o @ digitado ("@Fulano.Silva " → "fulano.silva"). Vazio ou inválido vira undefined. */
export function cleanHandle(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const h = raw.trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) ? h : undefined;
}

export function isValidAvatar(avatar: unknown): avatar is string {
  if (typeof avatar !== "string" || !avatar) return false;
  if (avatar.startsWith("data:")) {
    return avatar.length <= LIMITS.maxAvatarLength && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar);
  }
  return isMascot(avatar);
}

// Sem letras/números ambíguos (0/O, 1/I/L) — fácil de ditar em voz alta.
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 4;

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
}
