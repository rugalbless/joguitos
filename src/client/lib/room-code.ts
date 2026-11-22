import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "../../shared/protocol";

export function generateRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  return [...bytes].map((b) => ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length]).join("");
}

export function normalizeRoomCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}
