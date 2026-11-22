// Catálogo de jogos. A metadata fica aqui (compartilhada) para o servidor validar
// número de jogadores e o site listar os jogos. A tela de cada jogo fica em src/client/games.

export type GameStatus = "available" | "soon";

export type GameMeta = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  minPlayers: number;
  maxPlayers: number;
  minutes: string;
  tags: string[];
  status: GameStatus;
};

export const GAMES: GameMeta[] = [
  {
    id: "adedonha",
    name: "Adedonha",
    emoji: "🔤",
    tagline: "Sorteia a letra, cada um preenche as categorias no celular. Repetiu? Vale metade.",
    minPlayers: 2,
    maxPlayers: 16,
    minutes: "15–30",
    tags: ["palavras", "rapidez"],
    status: "available",
  },
  {
    id: "mimica",
    name: "Mímica Relâmpago",
    emoji: "🎭",
    tagline: "Um imita, a galera chuta no celular. Quem acertar primeiro leva os pontos.",
    minPlayers: 2,
    maxPlayers: 16,
    minutes: "10–30",
    tags: ["ação", "risadas"],
    status: "available",
  },
  {
    id: "nao-fale-igual",
    name: "Não Fale o Mesmo que Eu",
    emoji: "💬",
    tagline: "Sai um tema e todo mundo responde ao mesmo tempo. Falou igual à máquina (ou ao amigo)? Perde uma vida!",
    minPlayers: 2,
    maxPlayers: 16,
    minutes: "10–20",
    tags: ["palavras", "eliminação"],
    status: "available",
  },
];

export function getGame(id: string | null | undefined): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
