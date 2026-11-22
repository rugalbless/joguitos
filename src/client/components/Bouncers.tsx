import { type RefObject, useEffect, useRef, useState } from "react";
import { Emoji } from "./Emoji";

// Desenhos que vão aparecendo a cada batida.
const POOL = ["🎲", "🃏", "🍿", "🎉", "🏆", "👑", "⭐", "🎈", "🧡", "🎭", "🔤", "💬", "🍕", "👻", "⚽", "🎬"];
const SIZES = [58, 46];
const SPEED = 30; // px por segundo

type Box = { x: number; y: number; w: number; h: number };
type Body = { x: number; y: number; vx: number; vy: number; size: number; lastHit: number };

/** Um desenho diferente de todos os que estão na tela agora. */
const pickOther = (onScreen: string[]) => {
  const options = POOL.filter((e) => !onScreen.includes(e));
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Emojis navegando dentro de `area` como o logo do DVD: batem nas bordas e nas linhas de texto
 * de `obstacles` (cada linha vira uma caixa de colisão) e trocam de desenho a cada batida.
 * Sem animação para quem pediu menos movimento: ficam parados num canto livre.
 */
export function Bouncers({ area, obstacles }: { area: RefObject<HTMLElement | null>; obstacles: RefObject<HTMLElement | null>[] }) {
  const [emojis, setEmojis] = useState(() => [POOL[0], POOL[1]]);
  const [hits, setHits] = useState([0, 0]);
  const els = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const host = area.current;
    if (!host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let boxes: Box[] = [];

    /** Caixas das linhas de texto, relativas à área. */
    function measure() {
      const r = host!.getBoundingClientRect();
      W = host!.clientWidth;
      H = host!.clientHeight;
      boxes = [];
      for (const ref of obstacles) {
        if (!ref.current) continue;
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        for (const line of range.getClientRects()) {
          if (line.width < 2) continue;
          // A caixa da linha inclui o espaço entre linhas: encolhe um pouco na vertical.
          const pad = line.height * 0.14;
          boxes.push({ x: line.left - r.left, y: line.top - r.top + pad, w: line.width, h: line.height - pad * 2 });
        }
      }
    }

    const hitbox = (b: Body) => ({ x: b.x + b.size * 0.12, y: b.y + b.size * 0.12, w: b.size * 0.76, h: b.size * 0.76 });
    const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    measure();
    // Começa em lugares livres, longe do texto.
    const bodies: Body[] = SIZES.map((size, i) => {
      let x = W - size - 8 - i * 70;
      let y = i === 0 ? 8 : H - size - 8;
      for (let t = 0; t < 40; t++) {
        const tryX = Math.random() * Math.max(1, W - size);
        const tryY = Math.random() * Math.max(1, H - size);
        const hb = { x: tryX + size * 0.12, y: tryY + size * 0.12, w: size * 0.76, h: size * 0.76 };
        if (!boxes.some((b) => overlaps(hb, b))) {
          x = tryX;
          y = tryY;
          break;
        }
      }
      const angle = Math.PI / 4 + (Math.PI / 2) * i + (Math.random() - 0.5) * 0.4;
      return { x, y, vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED, size, lastHit: 0 };
    });

    const place = () => bodies.forEach((b, i) => els.current[i]?.style.setProperty("transform", `translate3d(${b.x}px, ${b.y}px, 0)`));
    place();
    if (reduced) return;

    function bounce(i: number, now: number) {
      const b = bodies[i];
      // Encostado em algo, não fica trocando de desenho a cada quadro.
      if (now - b.lastHit < 300) return;
      b.lastHit = now;
      setEmojis((list) => list.map((e, j) => (j === i ? pickOther(list) : e)));
      setHits((list) => list.map((n, j) => (j === i ? n + 1 : n)));
    }

    let raf = 0;
    let last = performance.now();
    let sinceMeasure = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sinceMeasure += dt;
      if (sinceMeasure > 1) {
        // Fontes carregando ou texto quebrando diferente: remede de vez em quando.
        measure();
        sinceMeasure = 0;
      }

      bodies.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        let hit = false;
        if (b.x < 0) [b.x, b.vx, hit] = [0, Math.abs(b.vx), true];
        if (b.x + b.size > W) [b.x, b.vx, hit] = [W - b.size, -Math.abs(b.vx), true];
        if (b.y < 0) [b.y, b.vy, hit] = [0, Math.abs(b.vy), true];
        if (b.y + b.size > H) [b.y, b.vy, hit] = [H - b.size, -Math.abs(b.vy), true];

        for (const box of boxes) {
          const hb = hitbox(b);
          if (!overlaps(hb, box)) continue;
          // Sai pelo lado em que entrou menos.
          const left = hb.x + hb.w - box.x;
          const right = box.x + box.w - hb.x;
          const top = hb.y + hb.h - box.y;
          const bottom = box.y + box.h - hb.y;
          const m = Math.min(left, right, top, bottom);
          if (m === left) [b.x, b.vx] = [b.x - left, -Math.abs(b.vx)];
          else if (m === right) [b.x, b.vx] = [b.x + right, Math.abs(b.vx)];
          else if (m === top) [b.y, b.vy] = [b.y - top, -Math.abs(b.vy)];
          else [b.y, b.vy] = [b.y + bottom, Math.abs(b.vy)];
          hit = true;
        }
        if (hit) bounce(i, now);
      });

      // Um bate no outro: trocam de direção.
      const [a, c] = bodies;
      const dx = a.x + a.size / 2 - (c.x + c.size / 2);
      const dy = a.y + a.size / 2 - (c.y + c.size / 2);
      const minD = (a.size + c.size) * 0.38;
      if (dx * dx + dy * dy < minD * minD) {
        [a.vx, c.vx] = [c.vx, a.vx];
        [a.vy, c.vy] = [c.vy, a.vy];
        const d = Math.hypot(dx, dy) || 1;
        const push = (minD - d) / 2 + 0.5;
        a.x += (dx / d) * push;
        a.y += (dy / d) * push;
        c.x -= (dx / d) * push;
        c.y -= (dy / d) * push;
        bounce(0, now);
        bounce(1, now);
      }

      place();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", measure);
    };
  }, [area, obstacles]);

  return (
    <>
      {SIZES.map((size, i) => (
        <div
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          className="pointer-events-none absolute left-0 top-0 select-none will-change-transform"
          style={{ width: size, height: size, fontSize: size / 1.2 }}
          aria-hidden
        >
          {/* key muda a cada batida: o desenho novo entra com um "pop" */}
          <span key={hits[i]} className="block animate-pop">
            <span className="block animate-float" style={{ animationDelay: `${-i * 2}s` }}>
              <Emoji e={emojis[i]} />
            </span>
          </span>
        </div>
      ))}
    </>
  );
}
