# joguitos

Party games multiplayer (pt-BR) jogados presencialmente, cada jogador no celular. Hospedagem 100% gratuita no Cloudflare Workers + Durable Objects. Roteiro em ROADMAP.md: siga a fase atual.

- Stack: React 19, TS, Vite (`@cloudflare/vite-plugin`), Tailwind v4, React Router, `partyserver` (servidor) e `partysocket` (cliente).
- O servidor (`src/worker/room.ts`) é a fonte da verdade e valida toda ação. O cliente só envia intenções.
- Anti-trapaça: segredo (palavra sorteada, respostas antes da revelação) nunca sai do servidor. O `view()` de cada jogo tira tudo que entregaria a resposta, inclusive listas auxiliares (ex.: palavras já usadas). Ações que dão pista (chutes) têm limite de frequência. Configurações dos jogos: só o anfitrião muda.
- Tipos compartilhados ficam em `src/shared/` e não podem importar nada de DOM nem de Workers.
- Cores: use sempre os tokens semânticos (`bg-surface`, `text-muted`, `bg-accent`…) definidos em `src/client/index.css`, nunca cores fixas. Isso garante o tema escuro.
- Toda a UI é em português do Brasil e mobile-first.
- Ícones: nunca coloque emoji solto no JSX. Use `<Emoji e="🎉" />` (`src/client/components/Emoji.tsx`), que mostra o desenho próprio em SVG de `src/client/icons/art.ts`, no estilo "3D macio": volume com degradê radial (luz no alto à esquerda, tons de `GOLD`, `RED`…), brilho `hl()`, sem contorno; a sombra vem do filtro `#art-3d` (`ArtDefs.tsx`). Emoji novo precisa ganhar desenho lá (viewBox 64×64, ids de degradê com prefixo próprio), senão aparece o emoji do sistema.
- Avatares: use sempre `<Avatar avatar=… online=… />`. O avatar é um mascote oficial (`m01`…`m16`, imagens em `public/mascotes/`, lista em `src/shared/mascots.ts`) ou uma foto (data URL), e o aro verde de "conectado" aparece só no mascote do topo da sala (prop `status`); nos outros lugares quem caiu fica apagado.
- Restrição: tudo precisa caber no plano gratuito. Durable Objects só com `new_sqlite_classes` e hibernação ligada.
- Depois de mudar `wrangler.jsonc`, rode `npm run cf-typegen`. Rode `npm run typecheck` antes de concluir uma tarefa.
