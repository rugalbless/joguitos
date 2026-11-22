// Textos das páginas de cada jogo (/jogos/:id): o que é, como jogar e dicas.
// Também servem para o Google entender o site ("adedonha online", "jogo de mímica"…).

export type GameGuide = {
  /** Título da aba e do Google. */
  title: string;
  /** Descrição para o Google (até ~155 caracteres). */
  description: string;
  intro: string;
  steps: string[];
  tips: string[];
};

export const GUIDES: Record<string, GameGuide> = {
  adedonha: {
    title: "Adedonha (Stop) online com amigos · Joguitos",
    description: "Jogue Adedonha, o famoso Stop, com os amigos no celular: sorteio de letra, categorias, STOP, votação e pontuação automática. Grátis e sem cadastro.",
    intro:
      "A Adedonha (também chamada de Stop) de sempre, sem papel e sem caneta: o celular sorteia a letra, cada um preenche as categorias no seu aparelho e o próprio jogo cuida da votação e dos pontos.",
    steps: [
      "O anfitrião escolhe as categorias (Nome, Animal, Fruta, Lugar… ou inventa as suas) e quantas rodadas vão ser.",
      "Quando todo mundo aperta PRONTO, sai uma letra. Preencha cada categoria com uma palavra que comece com ela.",
      "Não sabe alguma? Aperte \"Não sei\" e siga para a próxima. Quem completar tudo pode gritar STOP!",
      "Depois do STOP, a galera vota em cada categoria: tocou em \"Não vale\" e a maioria concordou, a resposta é anulada.",
      "Resposta única vale 10 pontos, resposta igual à de outra pessoa vale 5. No fim, o pódio revela o campeão.",
    ],
    tips: [
      "Fuja das respostas óbvias: se todo mundo escrever \"Maçã\", cada um leva só 5.",
      "Acento e maiúscula não importam: \"São Paulo\" e \"sao paulo\" contam igual.",
      "Funciona com 2 a 16 pessoas, cada uma no seu celular, no mesmo lugar.",
    ],
  },
  mimica: {
    title: "Jogo de mímica online com amigos · Joguitos",
    description: "Mímica Relâmpago: o celular sorteia a palavra só para quem vai imitar e a galera chuta pelo celular contra o cronômetro. Grátis, sem instalar e sem cadastro.",
    intro:
      "A mímica clássica com cronômetro e placar: o celular sorteia a palavra só para quem vai imitar, e o resto da galera tenta adivinhar chutando no próprio celular.",
    steps: [
      "O anfitrião escolhe as categorias (Animais, Filmes, Profissões, Comidas… ou Aleatório), o tempo e quantas rodadas.",
      "A cada rodada, uma pessoa é sorteada (ou votada) para imitar. Só ela vê a palavra e pode trocar uma vez se não conhecer.",
      "Ao apertar \"Valendo!\", começa o cronômetro. Imite sem falar nada!",
      "A galera chuta pelo celular. Errou? O chute aparece para todos, e chute parecido mostra \"quase!\".",
      "Acertou falando em voz alta? Quem está imitando toca em quem acertou. Quem acerta ganha 10 pontos e quem imitou ganha 5.",
    ],
    tips: [
      "Comece pela categoria: com a mão, faça o gesto de \"filme\", \"animal\" ou \"comida\".",
      "Erros pequenos de digitação são perdoados: \"elefnte\" vale para Elefante.",
      "Dá para jogar a partir de 2 pessoas.",
    ],
  },
  "nao-fale-igual": {
    title: "Não Fale o Mesmo que Eu: jogo de palavras com amigos · Joguitos",
    description: "Sai um tema e todo mundo responde ao mesmo tempo. Falou igual à máquina ou ao amigo, perde uma vida. Jogo de festa grátis para jogar pelo celular.",
    intro:
      "Um jogo rápido de fugir do óbvio: sai um tema, todo mundo responde ao mesmo tempo no celular e quem falar igual perde uma vida. Sobra quem pensa diferente!",
    steps: [
      "Escolham o modo: contra a máquina (ela sorteia o tema e escolhe uma resposta em segredo) ou um de nós escolhe (uma pessoa inventa o tema e a palavra secreta).",
      "Todo mundo escreve a resposta e trava. Ninguém vê a resposta dos outros até a revelação.",
      "Na revelação, aparece a palavra secreta. Quem respondeu igual perde uma vida, e quem não respondeu a tempo também.",
      "Sem vidas, a pessoa está fora. Ganha quem sobrar, ou quem tiver mais vidas no fim das rodadas.",
    ],
    tips: [
      "A máquina adora o óbvio: em \"Frutas\", pense duas vezes antes de escrever \"Banana\".",
      "No modo um de nós escolhe, tente adivinhar o que o amigo escreveu… e escreva outra coisa.",
      "Dá para jogar a partir de 2 pessoas.",
    ],
  },
};
