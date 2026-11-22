# Joguitos — escopo e roteiro

## Visão

Um site de **jogos de festa para jogar presencialmente com amigos**, cada um usando o próprio celular.
O celular serve de controle, de cartinha secreta, de cronômetro e de urna de votação. A diversão acontece
na roda: falando, blefando, fazendo mímica, rindo.

- **Sem instalar nada, sem cadastro**: abre o link, escolhe apelido e bichinho, entra com um código de 4 letras.
- **Visual aconchegante e moderno**: paleta retrô: bege #DCC9A9, vermelho #B83A2D, verde #4E6851 e quase preto #1D1C1A, com uma gradezinha discreta de fundo, cantos bem arredondados, fontes Fredoka + Nunito, tema escuro automático.
- **Mobile-first**: tudo pensado para uma mão segurando o celular.
- **100% gratuito** para hospedar e para jogar.

## Stack (tudo gratuito)

| Parte | Escolha | Por quê |
|---|---|---|
| Front | React 19 + TypeScript + Vite | rápido, tipado, ecossistema grande |
| Estilo | Tailwind CSS v4 | tokens de tema em CSS (`src/client/index.css`) |
| Rotas | React Router | `/` e `/sala/:code` |
| Tempo real | Cloudflare **Durable Objects** + `partyserver`/`partysocket` | uma "sala" = um objeto com estado e WebSockets; reconexão automática |
| Hospedagem | **Cloudflare Workers** (site estático + salas no mesmo deploy) | plano Free sem cartão, URL `joguitos.<seu-usuario>.workers.dev` |
| CI/CD (futuro) | GitHub Actions | gratuito para repositório público |

**Por que não Vercel/Netlify/GitHub Pages?** Elas hospedam o site de graça, mas não mantêm WebSockets
abertos, e um jogo em grupo precisa disso. Usar Cloudflare para tudo resolve as duas coisas num lugar só.

**Limites do plano gratuito** (conferir em developers.cloudflare.com/durable-objects/platform/pricing):
cerca de 100 mil requisições por dia em Workers e em Durable Objects, e 13 mil GB-s de duração por dia.
Com a **hibernação** ligada, uma sala parada não consome nada. Para jogar entre amigos, dá e sobra.

## Arquitetura

```
celular ──WebSocket──▶ Worker (/parties/room/ABCD) ──▶ Durable Object "ABCD"
   ▲                                                   │ estado da sala (jogadores, fase, pontos)
   └────────────── broadcast { type: "state" } ◀───────┘ salvo no storage a cada mudança
```

- `src/shared/` tem o contrato (tipos de mensagem) e o catálogo de jogos, usados pelos dois lados.
- `src/worker/room.ts` é a fonte da verdade. O celular só manda **intenções** (`start`, `game`…) e o servidor valida tudo, inclusive quem é o anfitrião.
- `src/client/games/<jogo>/` tem a tela de cada jogo, carregada sob demanda.
- Identidade: cada celular gera um `id` fixo (localStorage). Se a pessoa recarregar a página, volta para a sala com os mesmos pontos.

---

## Roteiro

### Fase 0 — Fundação ✅ (feito)
- [x] Vite + React + TS + Tailwind v4 + Cloudflare Workers configurados
- [x] Tema aconchegante (claro/escuro) e componentes base (`Button`, `Card`, `Avatar`, `Pill`)
- [x] Criar sala, entrar por código, perfil (apelido + avatar)
- [x] Lobby em tempo real: anfitrião 👑, jogadores online/offline, remover jogador, convite por link
- [x] Troca automática de anfitrião quando ele cai
- [x] Fluxo lobby → jogando → resultados, com placar acumulado
- [x] Primeiro "jogo": **Placar da Galera** (removido depois; o placar geral da sala continua)

### Fase 1 — Lobby redondo e primeiro deploy
- [ ] Deploy no Cloudflare (`npm run deploy`) e teste real com 4 ou mais celulares
- [ ] QR Code do link da sala (gerado no próprio navegador)
- [ ] Anfitrião passa a coroa manualmente
- [ ] Vibração (`navigator.vibrate`) e sons curtos em eventos importantes, com botão de mudo
- [ ] PWA: instalável na tela inicial, ícones, tela cheia
- [ ] Validar o código da sala no Worker (`onBeforeConnect`) e limitar a taxa de mensagens
- [ ] Limpar salas abandonadas (alarme do Durable Object apaga o storage depois de ~6h sem uso)

### Fase 2 — Motor de jogos (o passo mais importante)
- [x] Interface `ServerGame` (`src/worker/games/types.ts`): `setup`, `action`, `view(playerId)`, `tick`, `playersChanged`, para que cada celular receba só **a sua visão**
- [x] Timers no servidor (alarme do DO), usados no STOP da Adedonha
- [x] Ação genérica `{ type: "game", action }` com payload tipado por jogo (`src/shared/games/<jogo>.ts`)
- [x] Pódio animado reutilizável (`src/client/components/Podium.tsx`) e ranking final com suspense igual em todos os jogos (`FinalReveal.tsx`)
- [ ] Testes do motor com Vitest (+ `@cloudflare/vitest-pool-workers`)

### Fase 3 — Primeiros jogos de verdade
Cada jogo é uma pasta em `src/client/games/` mais um módulo em `src/worker/games/`.
0. [x] **Adedonha**: regras na seção abaixo
1. [x] **Mímica Relâmpago**: regras na seção abaixo
2. [x] **Não Fale o Mesmo que Eu**: regras na seção abaixo

Conteúdo: bancos de palavras e perguntas em pt-BR, em JSON dentro do repo, com categorias (família, +18 opcional, nerd…).

#### Adedonha: como funciona
1. **Configuração colaborativa**: qualquer pessoa liga e desliga categorias (18 prontas + inventadas) e escolhe o número de rodadas (1 a 10). Qualquer mudança zera os PRONTOs.
2. Quando **todos os conectados apertam PRONTO**, o servidor sorteia uma **letra** sem repetir (sem K, Q, W, X, Y, Z).
3. Uma categoria por vez na tela. Dá para **pular e voltar depois** ou tocar direto numa categoria. O rascunho é salvo no servidor, então recarregar a página não perde nada.
4. Quem preenche tudo pode gritar **STOP!**. São 3 segundos para os celulares enviarem o que estava digitado. O anfitrião também pode encerrar a rodada.
5. **Votação por categoria**: todas as respostas aparecem, cada um marca 👎 nas que não valem e confirma. A resposta é anulada quando a maioria dos outros jogadores vota contra. Resposta em branco ou com a letra errada é anulada automaticamente.
6. **Pontuação**: resposta única vale **10**, e resposta igual à de outra pessoa vale **5** (ignorando acentos e maiúsculas).
7. Depois da última rodada vem o **pódio animado com o top 3**, e o anfitrião pode pedir revanche com as mesmas categorias.

Ideias para a Adedonha: tempo-limite opcional por rodada, modo "letra escolhida", sinônimos aceitos como iguais e mais categorias prontas.

#### Mímica Relâmpago: como funciona
1. **Configuração colaborativa**: categorias (Aleatório ou Animais, Filmes e séries, Profissões, Ações, Objetos, Esportes, Comidas, Personagens), tempo (30s a 2 min), número de rodadas e como escolher quem imita. O anfitrião aperta Começar.
2. **Quem imita**: por **sorteio** (sai quem imitou menos vezes) ou por **votação** a cada rodada (vale votar em si mesmo). O anfitrião pode encerrar a votação.
3. **Palavra**: sorteio com animação de caça-níquel, só no celular do mímico, com o ícone da categoria. Ele pode trocar a palavra uma vez. O cronômetro só começa quando ele aperta **Valendo**.
4. **Adivinhando**: todos veem o cronômetro (sincronizado pelo relógio do servidor) e a categoria, e chutam no celular. Chutes errados aparecem para todos, e chute parecido mostra "quase!". A correção ignora acento, maiúscula, artigo e erro pequeno de digitação.
5. **Acertou falando**: como é presencial, o mímico pode tocar em quem acertou em voz alta.
6. **Pontuação**: quem acerta ganha **10**, o mímico ganha **5**. Tempo esgotado ou desistência: ninguém pontua.
7. Depois da última rodada vem o **pódio com confetes**, e o anfitrião pode pedir revanche.

Ideias para a Mímica: modo em times, palavras inventadas pela galera, nível de dificuldade.

#### Não Fale o Mesmo que Eu: como funciona
1. **Modos**: **contra a máquina** (a máquina sorteia um de 24 temas e escolhe uma resposta em segredo, de preferência das mais óbvias) ou **um de nós escolhe** (a vez passa por todos os vivos: quem escolhe inventa o tema e escreve a palavra secreta).
2. **Configuração**: vidas (2, 3 ou 5), tempo para responder (15, 25 ou 40s) e máximo de rodadas.
3. Todos respondem ao mesmo tempo e **travam** a resposta, que fica escondida até a revelação. Quando todos travam (ou o tempo acaba), vem a revelação com suspense.
4. **Perde uma vida** quem respondeu igual à palavra secreta (ignorando acento, maiúscula e erro pequeno de digitação) e quem não respondeu a tempo.
5. Sem vidas, a pessoa está fora. O jogo acaba quando sobra um ou quando chega no máximo de rodadas. Ranking por vidas e, entre eliminados, por quem durou mais. No placar da sala: 10, 6 e 3 pontos para o pódio.
6. Ranking final igual ao dos outros jogos (tambores e revelação do 1º lugar).

Ideias para o Não Fale: modo "ninguém pode repetir ninguém" (quem falar igual a outro jogador também perde vida), temas criados pela galera salvos na sala.

### Fase 4 — Pontuação e "noite de jogos"
- [ ] Placar da noite somando todos os jogos da sessão, com pódio animado no fim
- [ ] Estatísticas divertidas no fim ("mais votado como intruso", "mais rápido no quiz")
- [ ] Histórico opcional das noites (Cloudflare **D1**, também grátis), sem login: um link secreto do grupo
- [ ] Modo **TV/telão**: um notebook ou TV mostra o placar e as perguntas grandes, e os celulares viram só controle

### Fase 5 — Polimento
- [ ] Animações de transição (View Transitions / Motion), confetes, microinterações
- [ ] Acessibilidade: contraste, foco visível, `prefers-reduced-motion` (já respeitado)
- [ ] Filtro de palavrões nos apelidos e textos livres
- [ ] Página "Como jogar" de cada jogo
- [ ] CI no GitHub Actions: typecheck + testes + deploy automático na `main`

### Ideias para depois
- Times automáticos, modo "beber" opcional, jogos criados pela comunidade, i18n (es/en), domínio próprio (esse é o único item pago, então é opcional).

---

## Como adicionar um jogo
Use a Adedonha como modelo.
1. Metadata em `src/shared/games.ts` com `status: "available"`.
2. Tipos de estado e ação e as regras puras em `src/shared/games/<id>.ts`.
3. Lógica do servidor em `src/worker/games/<id>.ts` (implementa `ServerGame`), registrada em `src/worker/games/index.ts`. Use `view()` para esconder segredos.
4. Tela em `src/client/games/<id>/`, registrada em `src/client/games/index.ts`. A tela lê `room.game` e envia ações com `room.sendGame(...)`.
