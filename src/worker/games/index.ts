import { adedonha } from "./adedonha";
import { mimica } from "./mimica";
import { naoFaleIgual } from "./nao-fale-igual";
import type { ServerGame } from "./types";

// Jogos que têm lógica no servidor.
// Cada jogo tem seus próprios tipos de estado e de ação, por isso o `any` aqui.
export const SERVER_GAMES: Record<string, ServerGame<any, any>> = {
  adedonha,
  mimica,
  "nao-fale-igual": naoFaleIgual,
};
