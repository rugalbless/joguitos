// Não Fale o Mesmo que Eu: tipos, regras e temas da máquina, compartilhados entre o celular e o servidor.
import { checkGuess } from "./mimica";

/**
 * Temas da máquina. As respostas estão na ordem das mais óbvias para as menos óbvias:
 * a máquina prefere as primeiras, então fugir do óbvio é a graça do jogo.
 */
export const NFI_THEMES = [
  { name: "Comidas de fast-food", emoji: "🍔", items: ["Hambúrguer", "Batata frita", "Pizza", "Cachorro-quente", "Nuggets", "Milkshake", "Refrigerante", "Sanduíche", "Coxinha", "Pastel", "Taco", "Esfiha", "Sorvete", "Onion rings", "Burrito"] },
  { name: "Frutas", emoji: "🍓", items: ["Banana", "Maçã", "Laranja", "Morango", "Uva", "Abacaxi", "Manga", "Melancia", "Mamão", "Limão", "Pera", "Kiwi", "Melão", "Goiaba", "Maracujá", "Abacate"] },
  { name: "Cores", emoji: "🎨", items: ["Azul", "Vermelho", "Verde", "Amarelo", "Preto", "Branco", "Rosa", "Roxo", "Laranja", "Marrom", "Cinza", "Bege", "Lilás", "Dourado", "Prata"] },
  { name: "Animais de estimação", emoji: "🐶", items: ["Cachorro", "Gato", "Peixe", "Papagaio", "Hamster", "Coelho", "Tartaruga", "Calopsita", "Porquinho-da-índia", "Periquito", "Cobra", "Furão", "Iguana", "Canário"] },
  { name: "Times de futebol do Brasil", emoji: "⚽", items: ["Flamengo", "Corinthians", "Palmeiras", "São Paulo", "Vasco", "Santos", "Grêmio", "Internacional", "Cruzeiro", "Atlético Mineiro", "Fluminense", "Botafogo", "Bahia", "Sport", "Fortaleza"] },
  { name: "Marcas de carro", emoji: "🚗", items: ["Fiat", "Volkswagen", "Chevrolet", "Toyota", "Honda", "Ford", "Hyundai", "Renault", "BMW", "Ferrari", "Jeep", "Nissan", "Mercedes", "Peugeot", "Audi"] },
  { name: "Países", emoji: "🌎", items: ["Brasil", "Estados Unidos", "Argentina", "Portugal", "França", "Japão", "Itália", "China", "Alemanha", "Espanha", "México", "Canadá", "Inglaterra", "Rússia", "Egito"] },
  { name: "Bebidas", emoji: "🥤", items: ["Água", "Refrigerante", "Suco", "Café", "Cerveja", "Leite", "Chá", "Vinho", "Guaraná", "Caipirinha", "Achocolatado", "Energético", "Água de coco", "Vodka", "Limonada"] },
  { name: "Coisas de praia", emoji: "🏖️", items: ["Areia", "Guarda-sol", "Protetor solar", "Biquíni", "Toalha", "Prancha", "Chinelo", "Coco", "Cadeira", "Óculos de sol", "Boia", "Balde", "Concha", "Castelo de areia", "Picolé"] },
  { name: "Instrumentos musicais", emoji: "🎸", items: ["Violão", "Guitarra", "Piano", "Bateria", "Flauta", "Violino", "Pandeiro", "Saxofone", "Teclado", "Baixo", "Trompete", "Cavaquinho", "Sanfona", "Gaita", "Tambor"] },
  { name: "Matérias da escola", emoji: "📚", items: ["Matemática", "Português", "História", "Geografia", "Ciências", "Inglês", "Educação física", "Artes", "Física", "Química", "Biologia", "Filosofia", "Sociologia", "Espanhol", "Literatura"] },
  { name: "Super-heróis", emoji: "🦸", items: ["Homem-Aranha", "Batman", "Super-Homem", "Homem de Ferro", "Mulher-Maravilha", "Capitão América", "Hulk", "Thor", "Flash", "Pantera Negra", "Wolverine", "Aquaman", "Viúva Negra", "Lanterna Verde", "Deadpool"] },
  { name: "Partes do corpo", emoji: "🦵", items: ["Mão", "Pé", "Cabeça", "Olho", "Boca", "Nariz", "Braço", "Perna", "Orelha", "Joelho", "Dedo", "Barriga", "Costas", "Ombro", "Cotovelo"] },
  { name: "Doces de festa", emoji: "🍬", items: ["Brigadeiro", "Beijinho", "Bolo", "Cajuzinho", "Bicho de pé", "Pé de moleque", "Paçoca", "Quindim", "Olho de sogra", "Bem-casado", "Pudim", "Cocada", "Pirulito", "Bala", "Trufa"] },
  { name: "Aplicativos de celular", emoji: "📱", items: ["WhatsApp", "Instagram", "TikTok", "YouTube", "Facebook", "Spotify", "Netflix", "X", "Telegram", "Uber", "iFood", "Kwai", "Pinterest", "Discord", "LinkedIn"] },
  { name: "Meios de transporte", emoji: "🚌", items: ["Carro", "Ônibus", "Moto", "Bicicleta", "Avião", "Metrô", "Trem", "Barco", "Navio", "Helicóptero", "Patinete", "Caminhão", "Táxi", "Skate", "Van"] },
  { name: "Capitais do Brasil", emoji: "🏙️", items: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador", "Belo Horizonte", "Recife", "Fortaleza", "Curitiba", "Porto Alegre", "Manaus", "Belém", "Florianópolis", "Natal", "Goiânia", "Vitória"] },
  { name: "Sabores de pizza", emoji: "🍕", items: ["Calabresa", "Mussarela", "Portuguesa", "Frango com catupiry", "Margherita", "Quatro queijos", "Pepperoni", "Napolitana", "Atum", "Chocolate", "Bacon", "Palmito", "Lombo", "Romeu e Julieta", "Brócolis"] },
  { name: "Coisas da cozinha", emoji: "🍳", items: ["Panela", "Geladeira", "Fogão", "Faca", "Garfo", "Colher", "Prato", "Copo", "Micro-ondas", "Liquidificador", "Pia", "Frigideira", "Panela de pressão", "Concha", "Ralador"] },
  { name: "Animais da fazenda", emoji: "🐄", items: ["Vaca", "Galinha", "Porco", "Cavalo", "Ovelha", "Cabra", "Pato", "Burro", "Boi", "Galo", "Peru", "Coelho", "Ganso", "Bode", "Cachorro"] },
  { name: "Planetas", emoji: "🪐", items: ["Terra", "Marte", "Júpiter", "Saturno", "Vênus", "Mercúrio", "Netuno", "Urano", "Plutão"] },
  { name: "Profissões", emoji: "💼", items: ["Médico", "Professor", "Advogado", "Policial", "Bombeiro", "Engenheiro", "Dentista", "Enfermeiro", "Cozinheiro", "Motorista", "Pedreiro", "Veterinário", "Jogador de futebol", "Cantor", "Ator"] },
  { name: "Signos", emoji: "♌", items: ["Leão", "Escorpião", "Áries", "Gêmeos", "Virgem", "Câncer", "Touro", "Libra", "Peixes", "Aquário", "Sagitário", "Capricórnio"] },
  { name: "Esportes", emoji: "🏐", items: ["Futebol", "Vôlei", "Basquete", "Natação", "Tênis", "Corrida", "Boxe", "Surfe", "Skate", "Ciclismo", "Handebol", "Judô", "Golfe", "Futsal", "Ginástica"] },
] as const;

export const NFI_LIMITS = {
  minPlayers: 2,
  livesOptions: [2, 3, 5],
  defaultLives: 3,
  secondsOptions: [15, 25, 40],
  defaultSeconds: 25,
  minRounds: 3,
  maxRounds: 30,
  defaultRounds: 10,
  maxTextLength: 40,
} as const;

/** Pontos no placar geral da sala, por colocação no fim do jogo. */
export const NFI_PLACE_POINTS = [10, 6, 3] as const;

export type NfiMode = "maquina" | "jogador";
export type NfiStage = "setup" | "choosing" | "answering" | "reveal" | "final";

export type NfiRound = {
  round: number;
  category: string;
  secret: string;
  /** Quem perdeu vida nesta rodada por falar igual. */
  hit: string[];
  /** Quem perdeu vida por não responder. */
  silent: string[];
  answers: Record<string, string>;
};

export type NfiState = {
  stage: NfiStage;
  config: { mode: NfiMode; lives: number; seconds: number; rounds: number };
  round: number;
  /** Quem joga esta partida (quem estava conectado no começo). */
  players: string[];
  lives: Record<string, number>;
  /** Rodada em que cada um foi eliminado. */
  outAt: Record<string, number>;
  /** No modo "jogador": quem escolhe o tema e a palavra desta rodada. */
  chooserId: string | null;
  turns: Record<string, number>;
  category: string | null;
  categoryEmoji: string | null;
  /** A palavra secreta (da máquina ou de quem escolheu). Escondida até a revelação. */
  secret: string | null;
  /** Respostas da rodada. Até a revelação, cada celular só vê a própria. */
  answers: Record<string, string>;
  /** Quem já respondeu (público, sem o texto). */
  answered: string[];
  endsAt: number | null;
  usedThemes: string[];
  last: NfiRound | null;
  history: NfiRound[];
  serverNow?: number;
};

export type NfiAction =
  | { type: "set-mode"; mode: NfiMode }
  | { type: "set-lives"; lives: number }
  | { type: "set-seconds"; seconds: number }
  | { type: "set-rounds"; rounds: number }
  | { type: "start" }
  | { type: "choose"; category: string; secret: string }
  | { type: "answer"; text: string }
  | { type: "force-reveal" }
  | { type: "next" }
  | { type: "restart" };

/** Duas respostas são "a mesma"? Ignora acento, maiúscula, artigo e erro pequeno de digitação. */
export const sameAnswer = (a: string, b: string) => checkGuess(a, b) === "right";

/** Quem ainda tem vida. */
export const alive = (s: Pick<NfiState, "players" | "lives">) => s.players.filter((id) => (s.lives[id] ?? 0) > 0);

/** Ordena por vidas e, entre eliminados, por quem durou mais. */
export function nfiRanking(s: Pick<NfiState, "players" | "lives" | "outAt">) {
  return [...s.players].sort((a, b) => (s.lives[b] ?? 0) - (s.lives[a] ?? 0) || (s.outAt[b] ?? 1e9) - (s.outAt[a] ?? 1e9));
}
