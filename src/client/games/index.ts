import { type ComponentType, lazy } from "react";
import type { RoomApi } from "../lib/useRoom";

// Cada jogo é uma tela carregada sob demanda (o celular só baixa o jogo que vai jogar).
// Para adicionar um jogo: crie a pasta, registre aqui e mude o status em src/shared/games.ts.
export type GameScreenProps = { room: RoomApi & { state: NonNullable<RoomApi["state"]> } };

export const GAME_SCREENS: Record<string, ComponentType<GameScreenProps>> = {
  adedonha: lazy(() => import("./adedonha/AdedonhaGame")),
  mimica: lazy(() => import("./mimica/MimicaGame")),
  "nao-fale-igual": lazy(() => import("./nao-fale-igual/NfiGame")),
};
