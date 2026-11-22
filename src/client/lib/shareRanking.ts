// Gera o card do ranking final (PNG 1080×1350, estilo "cartaz") no próprio celular e abre a tela
// de compartilhar do aparelho. Nada é enviado para o servidor. As cores são as da paleta retrô do
// site (fixas, para o card sair igual em qualquer tema).
import { isMascot, mascotUrl } from "../../shared/mascots";

export type ShareEntry = { name: string; avatar: string; score: number; place: number; handle?: string };

const W = 1080;
const H = 1350;
const MAX_ROWS = 5;
const C = {
  bg: "#dcc9a9",
  ink: "#1d1c1a",
  muted: "#5e5546",
  red: "#b83a2d",
  green: "#4e6851",
  cream: "#f4ead8",
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function avatarImage(avatar: string) {
  if (isMascot(avatar)) return loadImage(mascotUrl(avatar));
  if (avatar.startsWith("data:image/")) return loadImage(avatar);
  return Promise.resolve(null);
}

function circleImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, r: number, ring: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = C.cream;
  ctx.fill();
  if (img) {
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = ring;
  ctx.stroke();
}

/** A carinha do logo, desenhada à mão. */
function logo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, box: string, face: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, s * 0.3);
  ctx.fillStyle = box;
  ctx.fill();
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x + s * 0.34, y + s * 0.4, s * 0.09, 0, Math.PI * 2);
  ctx.arc(x + s * 0.66, y + s * 0.4, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = "round";
  ctx.strokeStyle = face;
  ctx.arc(x + s / 2, y + s * 0.53, s * 0.18, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

/** Corta o texto com "…" para caber na largura. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

export async function renderRankingCard(game: string, subtitle: string, unit: string, entries: ShareEntry[]) {
  await document.fonts?.load("700 40px Fredoka").catch(() => {});
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = (size: number, weight = 700, family = "Fredoka") => `${weight} ${size}px ${family}, Nunito, sans-serif`;

  // Fundo bege e bloco vermelho do topo
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.red;
  ctx.fillRect(0, 0, W, 470);

  logo(ctx, 72, 64, 72, C.cream, C.red);
  ctx.fillStyle = C.cream;
  ctx.font = font(50);
  ctx.textBaseline = "middle";
  ctx.fillText("joguitos", 162, 102);
  ctx.textBaseline = "alphabetic";
  ctx.font = font(30, 800, "Nunito");
  ctx.letterSpacing = "8px";
  ctx.fillText("RANKING FINAL", 72, 270);
  ctx.letterSpacing = "0px";
  ctx.font = font(104);
  ctx.fillText(fit(ctx, game, W - 144), 72, 380);
  ctx.globalAlpha = 0.8;
  ctx.font = font(32, 600, "Nunito");
  ctx.fillText(fit(ctx, subtitle, W - 144), 72, 430);
  ctx.globalAlpha = 1;

  // Ranking em lista, com o @ de cada um (quem preencheu) para marcar no story
  const rows = entries.slice(0, MAX_ROWS);
  const imgs = await Promise.all(rows.map((e) => avatarImage(e.avatar)));
  rows.forEach((e, i) => {
    const y = 560 + i * 140;
    const first = e.place === 0;
    if (first) {
      ctx.beginPath();
      ctx.roundRect(48, y - 62, W - 96, 124, 32);
      ctx.fillStyle = C.cream;
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = first ? C.red : C.muted;
    ctx.font = font(first ? 64 : 52);
    ctx.fillText(`${e.place + 1}`, 130, y + 20);
    circleImage(ctx, imgs[i], 250, y, first ? 50 : 44, first ? C.red : C.green);

    ctx.textAlign = "left";
    ctx.fillStyle = C.ink;
    ctx.font = font(first ? 50 : 44);
    const nameY = e.handle ? y - 2 : y + 16;
    ctx.fillText(fit(ctx, e.name, 500), 320, nameY);
    if (e.handle) {
      ctx.fillStyle = first ? C.red : C.muted;
      ctx.font = font(28, 800, "Nunito");
      ctx.fillText(fit(ctx, `@${e.handle}`, 500), 320, y + 38);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = first ? C.red : C.ink;
    ctx.font = font(first ? 52 : 44);
    ctx.fillText(`${e.score}`, W - 150, y + 16);
    ctx.fillStyle = C.muted;
    ctx.font = font(26, 700, "Nunito");
    ctx.fillText(unit, W - 72, y + 14);

    if (!first && i < rows.length - 1) {
      ctx.fillStyle = "rgba(29,28,26,0.12)";
      ctx.fillRect(80, y + 70, W - 160, 2);
    }
  });

  ctx.textAlign = "center";
  if (entries.length > MAX_ROWS) {
    ctx.fillStyle = C.muted;
    ctx.font = font(30, 700, "Nunito");
    const more = entries.length - MAX_ROWS;
    ctx.fillText(`+ ${more} ${more === 1 ? "jogador" : "jogadores"}`, W / 2, 560 + MAX_ROWS * 140 - 30);
  }

  // Rodapé
  ctx.fillStyle = C.ink;
  ctx.font = font(30, 700, "Nunito");
  ctx.fillText(`Jogue com a galera: ${location.host}`, W / 2, H - 50);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/** Abre a tela de compartilhar do celular com a imagem; no computador, baixa o arquivo. */
export async function shareRanking(game: string, subtitle: string, unit: string, entries: ShareEntry[]) {
  const blob = await renderRankingCard(game, subtitle, unit, entries);
  const file = new File([blob], `joguitos-${game.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });
  const tags = entries.flatMap((e) => (e.handle ? [`@${e.handle}`] : [])).join(" ");
  const text = `Ranking de ${game} no joguitos!${tags ? ` ${tags}` : ""} Jogue com a galera: ${location.origin}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Ranking · ${game}`, text });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}
