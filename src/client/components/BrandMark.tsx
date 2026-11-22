import { useEffect, useRef } from "react";
import { cx } from "./ui";

// Marca pessoal do autor (rugalbless): trevo de quatro folhas ("bless": sorte, bênção)
// e a sigla RB. Não é do Joguitos: é a assinatura de quem fez.

/** Uma folha em forma de coração, com a ponta no centro (12, 12) e os lóbulos para cima. */
const LEAF = "M12 11.6C8.4 9.3 6.5 6.3 8.2 4.3C9.6 2.6 11.5 3.4 12 5C12.5 3.4 14.4 2.6 15.8 4.3C17.5 6.3 15.6 9.3 12 11.6Z";
const STEM = "M12.4 15Q14.8 18.4 13.8 22.4";
const ANGLES = [45, 135, 225, 315];

/** Trevo plano, usado como detalhe (assinatura, rodapé). */
export function Clover({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={STEM} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {ANGLES.map((r) => (
        <path key={r} d={LEAF} fill="currentColor" transform={`rotate(${r} 12 12)`} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------- marca animada

/** Desenha uma das formas (em coordenadas 24×24) num canvas de lado `px`. */
function drawShape(ctx: CanvasRenderingContext2D, px: number, shape: "clover" | "rb") {
  const k = px / 24;
  ctx.save();
  ctx.scale(k, k);
  if (shape === "clover") {
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D(STEM));
    const leaf = new Path2D(LEAF);
    for (const a of ANGLES) {
      ctx.save();
      ctx.translate(12, 12);
      ctx.rotate((a * Math.PI) / 180);
      ctx.translate(-12, -12);
      ctx.fill(leaf);
      ctx.restore();
    }
  } else {
    ctx.font = "700 15px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("RB", 12, 17.2);
  }
  ctx.restore();
}

/** Pontos (em px do canvas) que formam a figura, amostrados numa grade. */
function sample(px: number, step: number, shape: "clover" | "rb") {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = ctx.strokeStyle = "#000";
  drawShape(ctx, px, shape);
  const data = ctx.getImageData(0, 0, px, px).data;
  const points: { x: number; y: number }[] = [];
  for (let y = 0; y < px; y += step)
    for (let x = 0; x < px; x += step) if (data[(y * px + x) * 4 + 3] > 120) points.push({ x, y });
  return points;
}

const SPIN_MS = 12000; // uma volta inteira
const HOLD_MS = 4200; // figura inteira (girando)
const MORPH_MS = 3200; // desintegra e se monta na outra
const SPREAD_MS = 1300; // atraso entre o primeiro e o último grão (varre da esquerda pra direita)

type Grain = { ax: number; ay: number; bx: number; by: number; mx: number; my: number; delay: number };

/**
 * A marca do autor: o trevo e a sigla RB se alternando. Cada troca desintegra a figura em poeira
 * (da esquerda pra direita) que se junta de novo formando a outra. Gira devagar como uma moeda e a
 * cor vai passando pela paleta do site. Para quem pediu menos movimento, mostra só o trevo parado.
 */
export function BrandCoin({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const host = wrap.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let cancelled = false;

    async function start() {
      // A sigla usa a fonte Fredoka: espera ela carregar antes de amostrar.
      await document.fonts?.load("700 15px Fredoka").catch(() => {});
      if (cancelled) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const px = Math.max(16, Math.round(host.clientWidth * dpr));
      canvas.width = canvas.height = px;
      const step = Math.max(1, Math.round(px / 48)); // ~48 grãos de largura, em qualquer tamanho
      const dot = step * 1.15;

      const color = () => getComputedStyle(host).color;

      if (reduced) {
        ctx.fillStyle = ctx.strokeStyle = color();
        drawShape(ctx, px, "clover");
        return;
      }

      const A = sample(px, step, "clover");
      const B = sample(px, step, "rb");
      const shuffled = [...B].sort(() => Math.random() - 0.5);
      const n = Math.max(A.length, B.length);
      const grains: Grain[] = Array.from({ length: n }, (_, i) => {
        const a = A[i % A.length];
        const b = shuffled[i % shuffled.length];
        // Ponto de "poeira" no meio do caminho: sopra pra cima e pra direita.
        const mx = (a.x + b.x) / 2 + (0.25 + Math.random() * 0.45) * px * 0.6;
        const my = (a.y + b.y) / 2 - (0.1 + Math.random() * 0.5) * px * 0.5;
        return { ax: a.x, ay: a.y, bx: b.x, by: b.y, mx, my, delay: (a.x / px) * SPREAD_MS * 0.7 + Math.random() * SPREAD_MS * 0.3 };
      });

      const cycle = 2 * (HOLD_MS + MORPH_MS);
      const t0 = performance.now();
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

      const frame = (now: number) => {
        const t = (now - t0) % cycle;
        const fill = color();
        // Giro de moeda: quando a marca fica de costas, o desenho é espelhado de volta,
        // então o trevo e o RB nunca aparecem invertidos.
        const angle = (((now - t0) % SPIN_MS) / SPIN_MS) * 360;
        canvas.style.transform = `rotateY(${angle}deg)`;
        const backwards = Math.cos((angle * Math.PI) / 180) < 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, px, px);
        if (backwards) ctx.setTransform(-1, 0, 0, 1, px, 0);
        ctx.fillStyle = ctx.strokeStyle = fill;

        // Parado: desenha a figura inteira, nítida.
        if (t < HOLD_MS) drawShape(ctx, px, "clover");
        else if (t >= HOLD_MS + MORPH_MS && t < 2 * HOLD_MS + MORPH_MS) drawShape(ctx, px, "rb");
        else {
          // Transição: cada grão vai da origem até a poeira e da poeira até o destino.
          const toRb = t < HOLD_MS + MORPH_MS;
          const local = toRb ? t - HOLD_MS : t - (2 * HOLD_MS + MORPH_MS);
          const travel = MORPH_MS - SPREAD_MS;
          for (const g of grains) {
            const p = ease(Math.min(1, Math.max(0, (local - g.delay) / travel)));
            const [sx, sy, ex, ey] = toRb ? [g.ax, g.ay, g.bx, g.by] : [g.bx, g.by, g.ax, g.ay];
            // Curva de Bézier: origem → poeira → destino.
            const u = 1 - p;
            const x = u * u * sx + 2 * u * p * g.mx + p * p * ex;
            const y = u * u * sy + 2 * u * p * g.my + p * p * ey;
            // No meio do caminho o grão fica menor e mais transparente, como poeira.
            const mid = Math.sin(p * Math.PI);
            ctx.globalAlpha = 1 - mid * 0.75;
            const s = dot * (1 - mid * 0.45);
            ctx.fillRect(x, y, s, s);
          }
          ctx.globalAlpha = 1;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }
    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span
      ref={wrap}
      className={cx("inline-block text-accent animate-[brand-hue_20s_linear_infinite] [perspective:300px]", className)}
      aria-hidden
    >
      <canvas ref={ref} className="block size-full drop-shadow-[0_2px_1px_rgb(0_0_0/0.18)]" />
    </span>
  );
}
