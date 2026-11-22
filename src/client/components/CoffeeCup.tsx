import { WHITE, WOOD } from "../icons/art";

// Xícara de café no estilo "3D macio" dos ícones (src/client/icons/art.ts), com fumaça subindo.
// A fumaça é animada em CSS (keyframes `steam` em index.css), então respeita "reduzir movimento".

const STEAM = [
  { d: "M24 22C20 17 28 14 24 8C22 5 24 2 24 2", delay: "0s" },
  { d: "M32 20C28 15 36 12 32 6C30 3 32 0 32 0", delay: "-1.1s" },
  { d: "M40 22C36 17 44 14 40 8C38 5 40 2 40 2", delay: "-2.2s" },
];

export function CoffeeCup({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`overflow-visible ${className}`} aria-hidden>
      <defs>
        <linearGradient id="cup-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={WHITE[2]} />
          <stop offset=".3" stopColor={WHITE[0]} />
          <stop offset=".75" stopColor={WHITE[1]} />
          <stop offset="1" stopColor={WHITE[2]} />
        </linearGradient>
        <radialGradient id="cup-coffee" cx="40%" cy="40%" r="70%">
          <stop offset="0" stopColor={WOOD[1]} />
          <stop offset="1" stopColor={WOOD[2]} />
        </radialGradient>
        <linearGradient id="cup-saucer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WHITE[0]} />
          <stop offset="1" stopColor={WHITE[2]} />
        </linearGradient>
      </defs>

      {STEAM.map((s) => (
        <path
          key={s.d}
          d={s.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="animate-[steam_3.3s_ease-in-out_infinite] text-muted/60 [transform-box:fill-box] [transform-origin:bottom]"
          style={{ animationDelay: s.delay }}
        />
      ))}

      <g filter="url(#art-3d)">
        <ellipse cx="32" cy="55" rx="27" ry="6" fill="url(#cup-saucer)" />
        <path d="M49 31Q59 30 58 39Q57 47 47 46" fill="none" stroke={WHITE[2]} strokeWidth="5" strokeLinecap="round" />
        <path d="M49 31Q59 30 58 39Q57 47 47 46" fill="none" stroke={WHITE[0]} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 26H52V40Q52 54 32 54Q12 54 12 40Z" fill="url(#cup-body)" />
        <ellipse cx="32" cy="26" rx="20" ry="5.5" fill={WHITE[1]} />
        <ellipse cx="32" cy="26.6" rx="17" ry="4.2" fill="url(#cup-coffee)" />
        <ellipse cx="27" cy="25.6" rx="5" ry="1.2" fill="#fff" opacity=".35" />
        <rect x="17" y="31" width="3.5" height="15" rx="1.75" fill="#fff" opacity=".8" />
      </g>
    </svg>
  );
}
