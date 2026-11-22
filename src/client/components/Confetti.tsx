import { useEffect, useRef } from "react";
import { BLUE, GOLD, GREEN, PINK, PURPLE, RED, YELLOW } from "../icons/art";

// Confete de papel desenhado em canvas: uma explosão do centro e dois canhões nos cantos.
// Cada papelzinho gira e "vira" (achata e desachata) enquanto cai balançando, o que dá a
// sensação de 3D sem biblioteca nenhuma. As cores são as mesmas dos ícones (src/client/icons/art.ts).

const COLORS = [RED[1], GOLD[1], GREEN[1], BLUE[1], PURPLE[1], PINK[1], YELLOW[0], "#ffffff"];
const DURATION_MS = 5200;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  shape: "rect" | "ribbon" | "dot";
  rot: number;
  spin: number;
  flip: number;
  flipSpeed: number;
  sway: number;
};

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const make = (x: number, y: number, angle: number, spread: number, speed: number): Piece => {
      const a = angle + rnd(-spread, spread);
      const v = speed * rnd(0.55, 1.1);
      const roll = Math.random();
      const shape = roll < 0.6 ? "rect" : roll < 0.85 ? "ribbon" : "dot";
      return {
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: shape === "ribbon" ? rnd(4, 5.5) : rnd(10, 15),
        h: shape === "ribbon" ? rnd(18, 26) : rnd(6, 9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape,
        rot: rnd(0, Math.PI * 2),
        spin: rnd(-6, 6),
        flip: rnd(0, Math.PI * 2),
        flipSpeed: rnd(6, 12),
        sway: rnd(0, Math.PI * 2),
      };
    };

    const up = -Math.PI / 2;
    const scale = Math.min(1, H / 800);
    const pieces: Piece[] = [
      // explosão do centro, para cima
      ...Array.from({ length: 110 }, () => make(W / 2, H * 0.45, up, 1.1, 1100 * scale)),
      // canhões nos cantos de baixo
      ...Array.from({ length: 50 }, () => make(-10, H, up + 0.55, 0.25, 1500 * scale)),
      ...Array.from({ length: 50 }, () => make(W + 10, H, up - 0.55, 0.25, 1500 * scale)),
    ];

    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const age = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, (DURATION_MS - age) / 900);
      for (const p of pieces) {
        // ar: o papel desacelera rápido e depois cai devagar, balançando
        const drag = p.vy > 0 ? 3.2 : 1.6;
        p.vx -= p.vx * drag * dt;
        p.vy += 1400 * scale * dt;
        p.vy -= p.vy * drag * dt;
        p.sway += dt * 3;
        p.x += (p.vx + Math.sin(p.sway) * 40) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        p.flip += p.flipSpeed * dt;
        if (p.y > H + 30) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const f = Math.cos(p.flip);
        ctx.scale(1, f);
        ctx.beginPath();
        if (p.shape === "dot") ctx.arc(0, 0, p.w / 2.2, 0, Math.PI * 2);
        else ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.fillStyle = p.color;
        ctx.fill();
        // o verso do papel fica um pouco mais escuro
        if (f < 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
          ctx.fill();
        }
        ctx.restore();
      }
      if (age < DURATION_MS) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40 size-full" aria-hidden />;
}
