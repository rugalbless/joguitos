// Mímica Relâmpago: tipos, regras e banco de palavras compartilhados entre o celular e o servidor.
import { normalizeAnswer } from "./adedonha";

export const MIMICA_CATEGORIES = [
  {
    id: "animais",
    name: "Animais",
    emoji: "🐾",
    words: [["Cachorro", "🐶"], ["Gato", "🐱"], ["Elefante", "🐘"], ["Macaco", "🐒"], ["Girafa", "🦒"], ["Cobra", "🐍"], ["Canguru", "🦘"], ["Pinguim", "🐧"], ["Galinha", "🐔"], ["Leão", "🦁"], ["Tubarão", "🦈"], ["Borboleta", "🦋"], ["Sapo", "🐸"], ["Cavalo", "🐴"], ["Polvo", "🐙"], ["Coelho", "🐰"], ["Tartaruga", "🐢"], ["Águia", "🦅"], ["Caranguejo", "🦀"], ["Vaca", "🐮"], ["Porco", "🐷"], ["Jacaré", "🐊"], ["Morcego", "🦇"], ["Urso", "🐻"], ["Abelha", "🐝"]],
  },
  {
    id: "filmes",
    name: "Filmes e séries",
    emoji: "🎬",
    words: [["Titanic", "🚢"], ["Homem-Aranha", "🕷️"], ["O Rei Leão", "🦁"], ["Harry Potter", "🧙"], ["Procurando Nemo", "🐠"], ["Star Wars", "🌌"], ["Frozen", "❄️"], ["Toy Story", "🤠"], ["Matrix", "🕶️"], ["Shrek", "🧌"], ["Batman", "🦇"], ["Jurassic Park", "🦖"], ["Os Vingadores", "🦸"], ["Piratas do Caribe", "🏴‍☠️"], ["Carros", "🏎️"], ["Divertida Mente", "🧠"], ["Karatê Kid", "🥋"], ["Rocky", "🥊"], ["Chaves", "🛢️"], ["Stranger Things", "🚲"], ["La Casa de Papel", "🎭"], ["Round 6", "🦑"], ["O Auto da Compadecida", "🌵"], ["Tropa de Elite", "🚔"], ["Bob Esponja", "🧽"]],
  },
  {
    id: "profissoes",
    name: "Profissões",
    emoji: "💼",
    words: [["Médico", "🩺"], ["Bombeiro", "🚒"], ["Policial", "👮"], ["Dentista", "🦷"], ["Cozinheiro", "👨‍🍳"], ["Professor", "👩‍🏫"], ["Pedreiro", "🧱"], ["Pintor", "🎨"], ["Fotógrafo", "📷"], ["Garçom", "🍽️"], ["Motorista de ônibus", "🚌"], ["Piloto de avião", "✈️"], ["Mágico", "🎩"], ["Palhaço", "🤡"], ["Jardineiro", "🌻"], ["Cabeleireiro", "💇"], ["Astronauta", "🧑‍🚀"], ["Carteiro", "📬"], ["Salva-vidas", "🛟"], ["Maestro", "🎼"], ["Mecânico", "🔧"], ["Costureira", "🧵"], ["Pescador", "🎣"], ["Detetive", "🔍"], ["DJ", "🎧"]],
  },
  {
    id: "acoes",
    name: "Ações",
    emoji: "👟",
    words: [["Escovar os dentes", "🪥"], ["Tomar banho", "🚿"], ["Dirigir", "🚗"], ["Cozinhar", "🍳"], ["Dançar", "💃"], ["Dormir", "😴"], ["Pescar", "🎣"], ["Nadar", "🏊"], ["Andar de bicicleta", "🚴"], ["Tirar selfie", "🤳"], ["Lavar louça", "🍽️"], ["Passar roupa", "👕"], ["Trocar fralda", "👶"], ["Pular corda", "🪢"], ["Fazer flexão", "💪"], ["Espirrar", "🤧"], ["Bocejar", "🥱"], ["Cortar cebola", "🧅"], ["Abrir um presente", "🎁"], ["Pegar ônibus lotado", "🚌"], ["Montar uma barraca", "⛺"], ["Encher um balão", "🎈"], ["Escorregar numa casca de banana", "🍌"], ["Fazer churrasco", "🍖"], ["Ler um livro", "📖"]],
  },
  {
    id: "objetos",
    name: "Objetos",
    emoji: "📦",
    words: [["Guarda-chuva", "☂️"], ["Tesoura", "✂️"], ["Telefone", "☎️"], ["Escova de dentes", "🪥"], ["Martelo", "🔨"], ["Violão", "🎸"], ["Vassoura", "🧹"], ["Relógio", "⏰"], ["Óculos", "👓"], ["Geladeira", "🧊"], ["Máquina de lavar", "🫧"], ["Secador de cabelo", "💨"], ["Câmera", "📷"], ["Chave", "🔑"], ["Lanterna", "🔦"], ["Ventilador", "🌀"], ["Mochila", "🎒"], ["Controle remoto", "📺"], ["Pipa", "🪁"], ["Escada", "🪜"], ["Cadeira", "🪑"], ["Travesseiro", "🛏️"], ["Liquidificador", "🥤"], ["Micro-ondas", "🍿"], ["Bola", "⚽"]],
  },
  {
    id: "esportes",
    name: "Esportes",
    emoji: "⚽",
    words: [["Futebol", "⚽"], ["Basquete", "🏀"], ["Vôlei", "🏐"], ["Natação", "🏊"], ["Boxe", "🥊"], ["Tênis", "🎾"], ["Surfe", "🏄"], ["Skate", "🛹"], ["Golfe", "⛳"], ["Ciclismo", "🚴"], ["Corrida", "🏃"], ["Judô", "🥋"], ["Esgrima", "🤺"], ["Ginástica", "🤸"], ["Arco e flecha", "🏹"], ["Boliche", "🎳"], ["Patinação", "⛸️"], ["Hipismo", "🏇"], ["Levantamento de peso", "🏋️"], ["Beisebol", "⚾"], ["Pingue-pongue", "🏓"], ["Futevôlei", "🏖️"], ["Capoeira", "🤸"], ["Escalada", "🧗"], ["Esqui", "⛷️"]],
  },
  {
    id: "comidas",
    name: "Comidas",
    emoji: "🍕",
    words: [["Pizza", "🍕"], ["Pipoca", "🍿"], ["Sorvete", "🍦"], ["Banana", "🍌"], ["Macarrão", "🍝"], ["Hambúrguer", "🍔"], ["Brigadeiro", "🍫"], ["Pastel", "🥟"], ["Coxinha", "🍗"], ["Melancia", "🍉"], ["Churrasco", "🍖"], ["Feijoada", "🍲"], ["Cachorro-quente", "🌭"], ["Sushi", "🍣"], ["Pamonha", "🌽"], ["Algodão-doce", "🍭"], ["Milho", "🌽"], ["Ovo frito", "🍳"], ["Bolo de aniversário", "🎂"], ["Açaí", "🫐"], ["Tapioca", "🫓"], ["Pão de queijo", "🧀"], ["Laranja", "🍊"], ["Abacaxi", "🍍"], ["Chiclete", "🫧"]],
  },
  {
    id: "personagens",
    name: "Personagens",
    emoji: "👻",
    words: [["Super-Homem", "🦸"], ["Mulher-Maravilha", "🦸‍♀️"], ["Saci", "🌪️"], ["Papai Noel", "🎅"], ["Coelhinho da Páscoa", "🐰"], ["Pinóquio", "🤥"], ["Chapeuzinho Vermelho", "🧺"], ["Bruxa", "🧙‍♀️"], ["Vampiro", "🧛"], ["Zumbi", "🧟"], ["Múmia", "🧻"], ["Fantasma", "👻"], ["Pirata", "🏴‍☠️"], ["Ninja", "🥷"], ["Robô", "🤖"], ["Sereia", "🧜‍♀️"], ["Princesa", "👸"], ["Cavaleiro", "🛡️"], ["Mago", "🧙"], ["Monstro", "👹"], ["Alienígena", "👽"], ["Cupido", "💘"], ["Fada do dente", "🧚"], ["Lobisomem", "🐺"], ["Curupira", "🔥"]],
  },
] as const;

export type MimicaCategoryId = (typeof MIMICA_CATEGORIES)[number]["id"];
export const getMimicaCategory = (id: string | null | undefined) => MIMICA_CATEGORIES.find((c) => c.id === id);

/** Emoji da palavra (cai no ícone da categoria se a palavra não for achada). */
export function mimicaWordEmoji(word: string | null | undefined, category?: string | null) {
  for (const c of MIMICA_CATEGORIES) for (const [w, e] of c.words) if (w === word) return e as string;
  return getMimicaCategory(category)?.emoji ?? "🎲";
}

export const MIMICA_LIMITS = {
  minPlayers: 2,
  minRounds: 1,
  maxRounds: 20,
  defaultRounds: 5,
  secondsOptions: [30, 60, 90, 120],
  defaultSeconds: 60,
  maxGuessLength: 40,
  /** Quantos chutes errados ficam guardados para mostrar na tela. */
  maxGuessesShown: 8,
  swapsPerRound: 1,
} as const;

export const MIMICA_POINTS = { guesser: 10, mime: 5 } as const;

export type MimicaPick = "sorteio" | "votacao";
export type MimicaStage = "setup" | "choosing" | "reveal" | "playing" | "result" | "final";

export type MimicaGuess = { by: string; text: string; close: boolean };

export type MimicaState = {
  stage: MimicaStage;
  config: {
    /** Categorias ligadas. Todas ligadas = "Aleatório". */
    categories: MimicaCategoryId[];
    seconds: number;
    rounds: number;
    pick: MimicaPick;
  };
  round: number;
  mimeId: string | null;
  /** Quantas vezes cada um já foi o mímico (o sorteio prefere quem imitou menos). */
  turns: Record<string, number>;
  /** Votação de quem imita: eleitor → votado. */
  votes: Record<string, string>;
  /** A palavra só aparece no celular do mímico até a rodada acabar. */
  word: string | null;
  category: MimicaCategoryId | null;
  swapsLeft: number;
  startedAt: number | null;
  endsAt: number | null;
  guesses: MimicaGuess[];
  /** Quem acertou (null = ninguém, o tempo acabou ou o mímico desistiu). */
  winnerId: string | null;
  /** Segundos que levou para acertarem. */
  solvedIn: number | null;
  totals: Record<string, number>;
  /** Quantas mímicas cada um acertou e o acerto mais rápido (segundos), para o ranking final. */
  guessed: Record<string, number>;
  fastest: Record<string, number>;
  /** Só no servidor (a visão manda vazio): inclui a palavra da rodada. */
  usedWords: string[];
  /** Só no servidor: hora do último chute de cada um (limite de 1 por segundo). */
  guessAt?: Record<string, number>;
  /** Relógio do servidor na hora em que esta visão foi enviada (para os celulares acertarem o cronômetro). */
  serverNow?: number;
};

export type MimicaAction =
  | { type: "toggle-category"; id: MimicaCategoryId }
  | { type: "all-categories" }
  | { type: "set-seconds"; seconds: number }
  | { type: "set-rounds"; rounds: number }
  | { type: "set-pick"; pick: MimicaPick }
  | { type: "start" }
  | { type: "vote"; target: string }
  | { type: "force-pick" }
  | { type: "swap-word" }
  | { type: "begin" }
  | { type: "guess"; text: string }
  | { type: "award"; playerId: string }
  | { type: "give-up" }
  | { type: "next" }
  | { type: "restart" };

/** Tira artigos do começo ("o rei leão" → "rei leao") para não exigir o artigo no chute. */
function core(text: string) {
  return normalizeAnswer(text).replace(/^(o|a|os|as|um|uma) /, "");
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * Confere um chute. Ignora acento, maiúscula, pontuação, espaços e artigo no começo,
 * e perdoa erro pequeno de digitação (1 letra em palavras médias, 2 nas longas).
 */
export function checkGuess(guess: string, word: string): "right" | "close" | "wrong" {
  const g = core(guess).replace(/ /g, "");
  const w = core(word).replace(/ /g, "");
  if (!g) return "wrong";
  if (g === w) return "right";
  const d = distance(g, w);
  const tolerance = w.length >= 9 ? 2 : w.length >= 5 ? 1 : 0;
  if (d <= tolerance) return "right";
  if (d <= tolerance + 2 || (g.length >= 4 && w.includes(g))) return "close";
  return "wrong";
}
