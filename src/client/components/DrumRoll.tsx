import { GOLD, RED, WHITE, WOOD } from "../icons/art";

// Caixa de bateria no estilo "3D macio" dos ícones (src/client/icons/art.ts),
// com as baquetas batendo sem parar.

function Stick({ side }: { side: "l" | "r" }) {
  const left = side === "l";
  const d = left ? "M14 12L50 44" : "M106 12L70 44";
  return (
    <g
      style={{
        transformBox: "view-box",
        transformOrigin: left ? "14px 12px" : "106px 12px",
        animation: `stick-${side} 0.16s linear infinite`,
        animationDelay: left ? "0s" : "-0.08s",
      }}
    >
      <path d={d} stroke="url(#drum-wood)" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx={left ? 50 : 70} cy="44" r="5" fill="url(#drum-tip)" />
    </g>
  );
}

export function DrumRoll({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={`overflow-visible ${className}`} aria-hidden>
      <defs>
        <linearGradient id="drum-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={RED[2]} />
          <stop offset=".3" stopColor={RED[0]} />
          <stop offset=".6" stopColor={RED[1]} />
          <stop offset="1" stopColor={RED[2]} />
        </linearGradient>
        <linearGradient id="drum-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={GOLD[2]} />
          <stop offset=".3" stopColor={GOLD[0]} />
          <stop offset="1" stopColor={GOLD[2]} />
        </linearGradient>
        <radialGradient id="drum-head" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor={WHITE[0]} />
          <stop offset="1" stopColor={WHITE[2]} />
        </radialGradient>
        <linearGradient id="drum-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={WOOD[0]} />
          <stop offset="1" stopColor={WOOD[1]} />
        </linearGradient>
        <radialGradient id="drum-tip" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={WHITE[0]} />
          <stop offset="1" stopColor={WOOD[0]} />
        </radialGradient>
      </defs>
      <g filter="url(#art-3d)" style={{ animation: "drum-shake 0.08s linear infinite" }}>
        <path d="M20 52V78A40 11 0 0 0 100 78V52Z" fill="url(#drum-body)" />
        <path d="M24 58L36 80L46 60L56 82L66 60L76 82L86 60L96 78" fill="none" stroke={WHITE[1]} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" opacity=".9" />
        <path d="M20 76A40 11 0 0 0 100 76V80A40 11 0 0 1 20 80Z" fill="url(#drum-rim)" />
        <ellipse cx="60" cy="52" rx="41" ry="12" fill="url(#drum-rim)" />
        <ellipse cx="60" cy="51" rx="37" ry="9.5" fill="url(#drum-head)" />
        <ellipse cx="48" cy="48" rx="12" ry="3" fill="#fff" opacity=".7" />
      </g>
      <Stick side="l" />
      <Stick side="r" />
    </svg>
  );
}
