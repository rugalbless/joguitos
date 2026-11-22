// Ícones desenhados para o Joguitos (SVG próprio, viewBox 64×64), no estilo "3D macio":
// volume com degradê radial (luz no alto à esquerda), brilho de plástico, sem contorno.
// A sombra no chão vem do filtro #art-3d (src/client/components/ArtDefs.tsx), e o
// degradê de brilho #art-hl também fica lá, junto de ART_DEFS.
// A chave é o emoji equivalente: <Emoji e="🏆" />.

type Tone = readonly [light: string, base: string, dark: string];

export const GOLD: Tone = ["#ffe58a", "#f6b92b", "#c47a0c"];
export const RED: Tone = ["#ff9585", "#e9483f", "#a3211f"];
export const GREEN: Tone = ["#93e8a0", "#34ad56", "#166b37"];
export const BLUE: Tone = ["#96d3ff", "#3290e6", "#164f9a"];
export const ORANGE: Tone = ["#ffc390", "#f57c34", "#b4461a"];
export const WHITE: Tone = ["#ffffff", "#f4efe9", "#c9bbad"];
export const WOOD: Tone = ["#eeb784", "#b9763f", "#73401f"];
export const PURPLE: Tone = ["#dfb8ff", "#9d60e6", "#5a2ca3"];
export const PINK: Tone = ["#ffd3e2", "#f2789f", "#b43a62"];
export const SILVER: Tone = ["#ffffff", "#c8d1db", "#7b8898"];
export const BRONZE: Tone = ["#ffd0a2", "#d5833f", "#8a461b"];
export const DARK: Tone = ["#73737f", "#2f2f39", "#111116"];
export const YELLOW: Tone = ["#fff3a6", "#ffd23f", "#dc930f"];

/** Degradê radial com luz no alto à esquerda. Coordenadas relativas à forma. */
const rad = (id: string, [a, b, c]: Tone, cx = 34, cy = 26, r = 80) =>
  `<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="${r}%"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
/** Degradê linear de cima (claro) para baixo (escuro), ou na direção dada. */
const lin = (id: string, [a, b, c]: Tone, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
/** Brilho de plástico: elipse branca que se desfaz nas bordas. */
const hl = (cx: number, cy: number, rx: number, ry: number, rot = 0, op = 0.75) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#art-hl)" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
const defs = (...g: string[]) => `<defs>${g.join("")}</defs>`;

/** Degradês compartilhados, renderizados uma vez em ArtDefs. */
export const ART_DEFS = `
  <radialGradient id="art-hl"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

function medal(id: string, disc: Tone, ribbonA: string, ribbonB: string, n: string) {
  return `${defs(rad(`${id}d`, disc, 32, 28, 75), lin(`${id}a`, [ribbonA, ribbonA, ribbonB], 0, 1))}
    <path d="M17 3H29L37 25H26Z" fill="url(#${id}a)"/>
    <path d="M21 3H25L33 25H30Z" fill="#fff" opacity=".85"/>
    <path d="M47 3H35L27 25H38Z" fill="url(#${id}a)"/>
    <path d="M43 3H39L31 25H34Z" fill="#fff" opacity=".85"/>
    <circle cx="32" cy="41" r="19" fill="url(#${id}d)"/>
    <circle cx="32" cy="41" r="13.5" fill="none" stroke="${disc[2]}" stroke-width="2.2" opacity=".45"/>
    <circle cx="32" cy="41" r="13.5" fill="url(#${id}d)" transform="rotate(180 32 41)" opacity=".55"/>
    <text x="32" y="48.5" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="20" fill="${disc[2]}" opacity=".9">${n}</text>
    <text x="31.4" y="47.6" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="20" fill="${disc[0]}">${n}</text>
    ${hl(24, 31, 7, 4, -35)}`;
}

/** Cubo em perspectiva isométrica com faces mais claras em cima. Usado no dado. */
function cube(x: number, y: number, s: number, faces: [top: string, left: string, right: string]) {
  const h = s / 2;
  const top = `M${x} ${y}L${x + s} ${y + h}L${x} ${y + s}L${x - s} ${y + h}Z`;
  const left = `M${x - s} ${y + h}L${x} ${y + s}L${x} ${y + s * 2.1}L${x - s} ${y + h + s * 1.1}Z`;
  const right = `M${x} ${y + s}L${x + s} ${y + h}L${x + s} ${y + h + s * 1.1}L${x} ${y + s * 2.1}Z`;
  const round = (c: string) => `stroke="${c}" stroke-width="${s * 0.18}" stroke-linejoin="round"`;
  return {
    svg: `<path d="${left}" fill="${faces[1]}" ${round(faces[1])}/><path d="${right}" fill="${faces[2]}" ${round(faces[2])}/><path d="${top}" fill="${faces[0]}" ${round(faces[0])}/>`,
    /** matrix() que leva o quadrado unitário (0..1) para cada face. */
    topM: `matrix(${s} ${-h} ${s} ${h} ${x - s} ${y + h})`,
    leftM: `matrix(${s} ${h} 0 ${s * 1.1} ${x - s} ${y + h})`,
    rightM: `matrix(${s} ${-h} 0 ${s * 1.1} ${x} ${y + s})`,
  };
}

const pip = (u: number, v: number, fill = "#2f2f39") => `<circle cx="${u}" cy="${v}" r=".11" fill="${fill}"/>`;

/** Bloquinho de brinquedo visto de frente, com um pouco do topo e da lateral, e a letra grande na frente. */
function block(id: string, x: number, y: number, s: number, tone: Tone, letter: string) {
  const d = s * 0.22; // profundidade
  return `${defs(lin(`${id}f`, tone, 1, 1), lin(`${id}t`, [tone[0], tone[0], tone[1]], 0, 1))}
    <path d="M${x + d} ${y}H${x + s + d}L${x + s} ${y + d}H${x}Z" fill="url(#${id}t)" stroke="${tone[0]}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M${x + s} ${y + d}L${x + s + d} ${y}V${y + s}L${x + s} ${y + s + d}Z" fill="${tone[2]}" stroke="${tone[2]}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="${x}" y="${y + d}" width="${s}" height="${s}" rx="${s * 0.16}" fill="url(#${id}f)"/>
    <text x="${x + s / 2}" y="${y + d + s * 0.79}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="${s * 0.8}" fill="${tone[2]}" opacity=".55" transform="translate(0 ${s * 0.05})">${letter}</text>
    <text x="${x + s / 2}" y="${y + d + s * 0.79}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="${s * 0.8}" fill="#fff">${letter}</text>
    ${hl(x + s * 0.28, y + d + s * 0.2, s * 0.18, s * 0.08, -20, 0.6)}`;
}

export const ART: Record<string, string> = {
  // troféu
  "🏆": `${defs(rad("tr-c", GOLD, 30, 20, 85), lin("tr-s", GOLD, 0, 1), lin("tr-b", ORANGE, 0, 1), lin("tr-h", GOLD, 1, 0))}
    <path d="M17 13H9.5Q7 27 21 31" fill="none" stroke="url(#tr-h)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M47 13H54.5Q57 27 43 31" fill="none" stroke="url(#tr-h)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M15 8H49V22Q49 41 32 43Q15 41 15 22Z" fill="url(#tr-c)"/>
    <ellipse cx="32" cy="8.5" rx="17" ry="3.2" fill="${GOLD[2]}" opacity=".55"/>
    <path d="M28 42H36L37.5 50H26.5Z" fill="url(#tr-s)"/>
    <rect x="20" y="49" width="24" height="5" rx="2" fill="${GOLD[1]}"/>
    <rect x="16" y="53" width="32" height="8" rx="3" fill="url(#tr-b)"/>
    <path d="M32 17L34.8 22.7L41 23.5L36.5 27.8L37.6 34L32 31L26.4 34L27.5 27.8L23 23.5L29.2 22.7Z" fill="${ORANGE[1]}" stroke="${ORANGE[1]}" stroke-width="1.6" stroke-linejoin="round"/>
    ${hl(22, 18, 4, 8, 10, 0.8)}${hl(40, 13, 5, 2, 0, 0.5)}`,

  // medalhas
  "🥇": medal("m1", GOLD, "#ff7b6e", "#c8322c", "1"),
  "🥈": medal("m2", SILVER, "#7dbaf0", "#2a6ab8", "2"),
  "🥉": medal("m3", BRONZE, "#8fdc95", "#2f8d48", "3"),

  // coroa
  "👑": `${defs(rad("cr-g", GOLD, 30, 20, 90), lin("cr-b", GOLD, 0, 1), rad("cr-r", RED), rad("cr-u", BLUE), rad("cr-e", GREEN))}
    <path d="M9 46L6 19Q6 16 9 18L21 29L30 11Q32 8 34 11L43 29L55 18Q58 16 58 19L55 46Z" fill="url(#cr-g)" stroke="${GOLD[1]}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="8" y="44" width="48" height="11" rx="4" fill="url(#cr-b)"/>
    <circle cx="20" cy="49.5" r="3" fill="url(#cr-u)"/><circle cx="32" cy="49.5" r="3.4" fill="url(#cr-r)"/><circle cx="44" cy="49.5" r="3" fill="url(#cr-e)"/>
    <circle cx="6.5" cy="17.5" r="4" fill="url(#cr-r)"/><circle cx="32" cy="9" r="4.3" fill="url(#cr-u)"/><circle cx="57.5" cy="17.5" r="4" fill="url(#cr-e)"/>
    <circle cx="32" cy="33" r="5" fill="url(#cr-r)"/>
    ${hl(16, 31, 3, 7, -10, 0.7)}${hl(30.5, 31.5, 1.8, 1.2)}${hl(5.5, 16.3, 1.4, 1)}${hl(31, 7.6, 1.5, 1)}${hl(56.5, 16.3, 1.4, 1)}`,

  // dado
  "🎲": (() => {
    const c = cube(32, 5, 25, [WHITE[0], "#efe6dc", "#d4c6b8"]);
    return `${c.svg}
      <g transform="${c.topM}">${pip(0.5, 0.5, RED[1])}</g>
      <g transform="${c.leftM}">${pip(0.28, 0.28)}${pip(0.72, 0.72)}</g>
      <g transform="${c.rightM}">${pip(0.25, 0.25)}${pip(0.5, 0.5)}${pip(0.75, 0.75)}</g>
      ${hl(22, 14, 7, 3, 25, 0.6)}`;
  })(),

  // cartas
  "🃏": `${defs(lin("ca-b", GREEN, 1, 1), lin("ca-f", WHITE, 1, 1), rad("ca-h", RED))}
    <g transform="rotate(-14 26 36)">
      <rect x="9" y="12" width="30" height="42" rx="5" fill="url(#ca-b)"/>
      <rect x="13" y="16" width="22" height="34" rx="3" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55"/>
      <path d="M24 26l5 7-5 7-5-7z" fill="#fff" opacity=".55"/>
    </g>
    <g transform="rotate(10 40 34)">
      <rect x="25" y="10" width="30" height="42" rx="5" fill="url(#ca-f)"/>
      <text x="30" y="21" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="9" fill="${RED[1]}">A</text>
      <path d="M40 41C33 36 33 29 37 28C39 27.5 40 29 40 30.5C40 29 41 27.5 43 28C47 29 47 36 40 41Z" fill="url(#ca-h)" stroke="${RED[1]}" stroke-width="1.6" stroke-linejoin="round"/>
      ${hl(37.6, 30.5, 1.6, 1.1)}
    </g>`,

  // coração
  "🧡": `${defs(rad("he-g", ORANGE, 32, 22, 85))}
    <path d="M32 56C14 44 5 33 5 22C5 13 12 7 20 7C25.5 7 29.5 10 32 14.5C34.5 10 38.5 7 44 7C52 7 59 13 59 22C59 33 50 44 32 56Z" fill="url(#he-g)"/>
    ${hl(17, 18, 7, 4.5, -30, 0.85)}${hl(46, 15, 3, 1.8, 20, 0.5)}`,

  // porta
  "🚪": `${defs(lin("do-f", WOOD, 1, 1), lin("do-p", [WOOD[1], WOOD[1], WOOD[2]], 1, 1), rad("do-k", GOLD))}
    <rect x="12" y="4" width="40" height="57" rx="5" fill="${WOOD[2]}"/>
    <rect x="16" y="8" width="32" height="53" rx="3" fill="url(#do-f)"/>
    <rect x="20" y="12" width="24" height="18" rx="2.5" fill="url(#do-p)" opacity=".75"/>
    <rect x="20" y="34" width="24" height="21" rx="2.5" fill="url(#do-p)" opacity=".75"/>
    <circle cx="41" cy="33" r="3.4" fill="url(#do-k)"/>
    ${hl(22, 16, 2, 5, 0, 0.45)}${hl(40, 31.8, 1.3, 0.9)}`,

  // ampulheta
  "⏳": `${defs(lin("ho-w", WOOD, 0, 1), lin("ho-s", YELLOW, 0, 1))}
    <path d="M17 11H47Q47 26 35 32Q47 38 47 53H17Q17 38 29 32Q17 26 17 11Z" fill="#cfeaff" opacity=".55"/>
    <path d="M22 19H42Q40 26 32 30Q24 26 22 19Z" fill="url(#ho-s)"/>
    <path d="M32 33L33 46" stroke="${YELLOW[1]}" stroke-width="1.6"/>
    <path d="M21 53Q24 44 32 44Q40 44 43 53Z" fill="url(#ho-s)"/>
    <path d="M17 11H47Q47 26 35 32Q47 38 47 53H17Q17 38 29 32Q17 26 17 11Z" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>
    <rect x="11" y="4" width="42" height="8" rx="4" fill="url(#ho-w)"/>
    <rect x="11" y="52" width="42" height="8" rx="4" fill="url(#ho-w)"/>
    ${hl(22, 20, 1.6, 6, -12, 0.9)}${hl(20, 6.5, 6, 1.4, 0, 0.6)}`,

  // festa (lança-confete)
  "🎉": `${defs(lin("pa-c", PURPLE, 1, 0), lin("pa-s", GOLD, 1, 0))}
    <path d="M6 58L18 22L42 46Z" fill="url(#pa-c)" stroke="${PURPLE[1]}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M11 44L15 33L31 47L20 51Z" fill="url(#pa-s)"/>
    <ellipse cx="30" cy="34" rx="5.5" ry="17" transform="rotate(-45 30 34)" fill="${PURPLE[2]}" opacity=".6"/>
    <path d="M34 20Q38 10 46 12Q52 14 54 8" fill="none" stroke="${RED[1]}" stroke-width="3" stroke-linecap="round"/>
    <path d="M42 30Q50 26 56 30" fill="none" stroke="${BLUE[1]}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="27" cy="12" r="2.6" fill="${GOLD[1]}"/><circle cx="56" cy="20" r="2.4" fill="${GREEN[1]}"/><circle cx="48" cy="40" r="2.6" fill="${PINK[1]}"/>
    <rect x="36" y="4" width="4" height="7" rx="1.5" fill="${GREEN[1]}" transform="rotate(25 38 7)"/>
    <rect x="57" y="36" width="4" height="7" rx="1.5" fill="${GOLD[1]}" transform="rotate(-30 59 39)"/>
    ${hl(14, 39, 1.6, 6, 20, 0.7)}`,

  // pipoca
  "🍿": `${defs(lin("po-r", RED, 1, 0), rad("po-k", [WHITE[0], "#fbf1dc", "#e8c98e"], 35, 30, 80))}
    ${[
      [18, 18, 7],
      [28, 12, 7.5],
      [39, 13, 7],
      [47, 20, 6.5],
      [23, 24, 6.5],
      [35, 22, 7],
      [44, 27, 5.5],
      [15, 27, 5],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#po-k)"/>`)
      .join("")}
    <path d="M10 27H54L49 60H15Z" fill="#fff"/>
    <path d="M10 27H18.5L20 60H15Z M27 27H37L36.5 60H27.5Z M45.5 27H54L49 60H44Z" fill="url(#po-r)"/>
    <path d="M10 27H54L49 60H15Z" fill="#000" opacity=".06"/>
    <rect x="8" y="25" width="48" height="5" rx="2.5" fill="${RED[1]}"/>
    ${hl(24, 9.5, 3, 1.8)}${hl(15, 15, 2.4, 1.5)}${hl(36, 10, 2.5, 1.5)}${hl(13, 40, 1.4, 6, 0, 0.5)}`,

  // blocos ABC
  "🔤": `${block("ab1", 3, 33, 26, RED, "A")}${block("ab3", 33, 33, 26, BLUE, "C")}${block("ab2", 17, 4, 26, GOLD, "B")}`,

  // balões de fala
  "💬": `${defs(rad("ch-b", BLUE), rad("ch-w", WHITE))}
    <path d="M27 6C14 6 5 14 5 24C5 30 8 35 13 38L11 46L20 41C22 41.6 24.5 42 27 42C40 42 49 34 49 24C49 14 40 6 27 6Z" fill="url(#ch-b)"/>
    <path d="M39 22C50 22 59 29 59 38C59 43 56.5 47.5 52 50.5L54 58L46 53.5C44 54 41.5 54.5 39 54.5C28 54.5 19 47 19 38C19 29 28 22 39 22Z" fill="url(#ch-w)"/>
    ${hl(17, 14, 6, 3, -25, 0.8)}${hl(31, 30, 5, 2.5, -20, 0.9)}`,

  // máscaras de teatro
  "🎭": `${defs(rad("ma-g", GOLD, 35, 25, 85), rad("ma-b", BLUE, 35, 25, 85))}
    <g transform="rotate(14 44 36)">
      <path d="M30 18Q44 13 58 18Q60 40 44 52Q28 40 30 18Z" fill="url(#ma-b)"/>
      <path d="M35 27Q38 24 41 27 M47 27Q50 24 53 27" fill="none" stroke="${BLUE[2]}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M38 42Q44 35 50 42" fill="none" stroke="${BLUE[2]}" stroke-width="2.8" stroke-linecap="round"/>
    </g>
    <g transform="rotate(-12 22 30)">
      <path d="M6 12Q20 7 34 12Q36 34 20 46Q4 34 6 12Z" fill="url(#ma-g)"/>
      <path d="M11 22Q14 18 17 22 M23 22Q26 18 29 22" fill="none" stroke="${GOLD[2]}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M13 30Q20 39 27 30Z" fill="${GOLD[2]}"/>
      ${hl(12, 15, 4, 2, -10, 0.8)}
    </g>`,

  // certo
  "✅": `${defs(rad("ok-g", GREEN))}
    <circle cx="32" cy="32" r="27" fill="url(#ok-g)"/>
    <path d="M19 33L28 42L46 23" fill="none" stroke="${GREEN[2]}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" opacity=".35" transform="translate(0 1.5)"/>
    <path d="M19 33L28 42L46 23" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${hl(21, 17, 9, 4.5, -30, 0.7)}`,

  // errado
  "❌": `${defs(rad("no-g", RED))}
    <circle cx="32" cy="32" r="27" fill="url(#no-g)"/>
    <path d="M22 22L42 42M42 22L22 42" fill="none" stroke="${RED[2]}" stroke-width="7.5" stroke-linecap="round" opacity=".35" transform="translate(0 1.5)"/>
    <path d="M22 22L42 42M42 22L22 42" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round"/>
    ${hl(21, 17, 9, 4.5, -30, 0.7)}`,

  // placa de pare
  "🛑": `${defs(rad("st-g", RED, 34, 26, 85))}
    <path d="M22 4H42L60 22V42L42 60H22L4 42V22Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
    <path d="M23.5 8H40.5L56 23.5V40.5L40.5 56H23.5L8 40.5V23.5Z" fill="url(#st-g)" stroke="${RED[1]}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="16" y="28" width="32" height="9" rx="4.5" fill="${RED[2]}" opacity=".35" transform="translate(0 1.5)"/>
    <rect x="16" y="28" width="32" height="9" rx="4.5" fill="#fff"/>
    ${hl(22, 17, 8, 3.5, -30, 0.65)}`,

  // carinha derretendo
  "🫠": `${defs(rad("me-g", YELLOW, 36, 26, 80))}
    <path d="M10 32C10 18 20 8 32 8C44 8 54 18 54 32C54 40 56 46 58 50C59 53 55 55 52 52C50 50 48 51 48 54C48 58 42 59 41 55C40 52 37 52 36 55C35 58 29 58 28 55C27 52 24 52 22 55C20 58 14 57 15 53C16 49 12 48 10 51C8 54 4 52 6 49C8 45 10 40 10 32Z" fill="url(#me-g)"/>
    <ellipse cx="24" cy="29" rx="3" ry="4" fill="#3b2a22"/><ellipse cx="40" cy="29" rx="3" ry="4" fill="#3b2a22"/>
    <circle cx="25" cy="27.5" r="1.1" fill="#fff"/><circle cx="41" cy="27.5" r="1.1" fill="#fff"/>
    <path d="M25 39Q32 45 39 39" fill="none" stroke="#3b2a22" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="18" cy="37" rx="3.5" ry="2.2" fill="${PINK[1]}" opacity=".5"/><ellipse cx="46" cy="37" rx="3.5" ry="2.2" fill="${PINK[1]}" opacity=".5"/>
    ${hl(21, 16, 7, 3.5, -30, 0.8)}`,

  // meia
  "🧦": `${defs(lin("so-w", WHITE, 1, 0.3), lin("so-r", RED, 1, 0), rad("so-g", GREEN, 40, 30, 80))}
    <clipPath id="so-c"><path d="M17 4H41V34Q41 39 47 41L52 43Q60 46 58.5 53.5Q57 60.5 48.5 59.5L27 56.5Q15.5 54.5 16.5 43Z"/></clipPath>
    <path d="M17 4H41V34Q41 39 47 41L52 43Q60 46 58.5 53.5Q57 60.5 48.5 59.5L27 56.5Q15.5 54.5 16.5 43Z" fill="url(#so-w)"/>
    <g clip-path="url(#so-c)">
      <rect x="10" y="4" width="40" height="7" fill="url(#so-r)"/>
      <rect x="10" y="15" width="40" height="4.5" fill="url(#so-r)"/>
      <rect x="10" y="24" width="40" height="4.5" fill="url(#so-r)"/>
      <circle cx="21" cy="54" r="10" fill="url(#so-g)"/>
      <circle cx="59" cy="52" r="9" fill="url(#so-g)"/>
    </g>
    ${hl(23, 22, 2.2, 9, 0, 0.55)}`,

  // câmera
  "📷": `${defs(rad("cm-b", BLUE, 30, 20, 90), rad("cm-l", DARK, 38, 32, 70), lin("cm-t", SILVER, 0, 1))}
    <path d="M22 10H38Q40 10 41 12L43 16H22Z" fill="url(#cm-t)"/>
    <rect x="5" y="15" width="54" height="40" rx="9" fill="url(#cm-b)"/>
    <rect x="5" y="22" width="54" height="5" fill="${BLUE[2]}" opacity=".35"/>
    <circle cx="32" cy="36" r="14" fill="${SILVER[1]}"/>
    <circle cx="32" cy="36" r="11" fill="url(#cm-l)"/>
    <circle cx="32" cy="36" r="5" fill="#3b4b6b"/>
    <circle cx="49" cy="22" r="3" fill="${GOLD[1]}"/>
    ${hl(28, 32, 3.5, 2.2, -30, 0.9)}${hl(14, 21, 6, 2.2, 0, 0.6)}`,

  // ponto de interrogação
  "❔": `${defs(rad("qu-g", WHITE, 34, 26, 85))}
    <circle cx="32" cy="32" r="27" fill="url(#qu-g)"/>
    <text x="32" y="45" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="36" fill="${ORANGE[2]}" opacity=".35" transform="translate(0 1.5)">?</text>
    <text x="32" y="45" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="36" fill="${ORANGE[1]}">?</text>
    ${hl(21, 17, 9, 4.5, -30, 0.7)}`,

  // brilhos
  "✨": `${defs(rad("sp-g", GOLD), rad("sp-p", PINK), rad("sp-b", BLUE))}
    <path d="M26 8Q29 26 46 29Q29 32 26 52Q23 32 6 29Q23 26 26 8Z" fill="url(#sp-g)"/>
    <path d="M48 4Q49.5 12 57 13.5Q49.5 15 48 23Q46.5 15 39 13.5Q46.5 12 48 4Z" fill="url(#sp-p)"/>
    <path d="M49 38Q50.3 44.5 56 46Q50.3 47.5 49 54Q47.7 47.5 42 46Q47.7 44.5 49 38Z" fill="url(#sp-b)"/>
    ${hl(23, 24, 2, 5, 0, 0.8)}`,

  // estrela
  "⭐": `${defs(rad("sa-g", GOLD, 36, 26, 85))}
    <path d="M32 6L39.5 21.5L56.5 23.8L44 35.6L47.2 52.5L32 44.4L16.8 52.5L20 35.6L7.5 23.8L24.5 21.5Z" fill="url(#sa-g)" stroke="${GOLD[1]}" stroke-width="5" stroke-linejoin="round"/>
    ${hl(25, 22, 6, 3, -30, 0.85)}`,

  // balão
  "🎈": `${defs(rad("ba-g", RED, 34, 26, 80))}
    <path d="M32 47Q30 55 34 58Q37 61 33 63" fill="none" stroke="#9aa3ad" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M32 4C44 4 52 13 52 24C52 36 42 46 32 47C22 46 12 36 12 24C12 13 20 4 32 4Z" fill="url(#ba-g)"/>
    <path d="M29 46.5L35 46.5L33.5 50.5H30.5Z" fill="${RED[2]}"/>
    ${hl(23, 15, 5, 8, 25, 0.9)}`,

  // ---------- categorias da Mímica ----------
  // patinha (animais)
  "🐾": `${defs(rad("pw-g", WOOD, 36, 28, 80), rad("pw-p", PINK, 36, 28, 80))}
    <ellipse cx="32" cy="42" rx="15" ry="13" fill="url(#pw-g)"/>
    <ellipse cx="14" cy="28" rx="6" ry="7.5" fill="url(#pw-g)" transform="rotate(-20 14 28)"/>
    <ellipse cx="25" cy="16" rx="6" ry="8" fill="url(#pw-g)" transform="rotate(-8 25 16)"/>
    <ellipse cx="39" cy="16" rx="6" ry="8" fill="url(#pw-g)" transform="rotate(8 39 16)"/>
    <ellipse cx="50" cy="28" rx="6" ry="7.5" fill="url(#pw-g)" transform="rotate(20 50 28)"/>
    <ellipse cx="32" cy="44" rx="9" ry="7.5" fill="url(#pw-p)"/>
    ${hl(26, 36, 5, 2.5, -20, 0.6)}${hl(23, 12, 1.8, 2.5, 0, 0.8)}${hl(37, 12, 1.8, 2.5, 0, 0.8)}${hl(12, 25, 1.6, 2.2, -20, 0.8)}${hl(48, 25, 1.6, 2.2, 20, 0.8)}`,

  // claquete (filmes)
  "🎬": `${defs(lin("cl-b", DARK, 0, 1), lin("cl-t", DARK, 1, 0))}
    <rect x="7" y="24" width="50" height="34" rx="5" fill="url(#cl-b)"/>
    <g transform="rotate(-14 9 22)">
      <rect x="7" y="12" width="50" height="11" rx="3" fill="url(#cl-t)"/>
      <path d="M14 12H21L16 23H9Z M28 12H35L30 23H23Z M42 12H49L44 23H37Z" fill="#fff"/>
    </g>
    <rect x="7" y="24" width="50" height="9" fill="#fff"/>
    <path d="M14 24H21L16 33H9Z M28 24H35L30 33H23Z M42 24H49L44 33H37Z" fill="${DARK[1]}"/>
    <rect x="13" y="40" width="22" height="3.5" rx="1.75" fill="#fff" opacity=".55"/>
    <rect x="13" y="47" width="14" height="3.5" rx="1.75" fill="#fff" opacity=".35"/>
    <circle cx="9.5" cy="24" r="2.6" fill="${SILVER[1]}"/>
    ${hl(46, 46, 5, 2.5, -20, 0.25)}`,

  // maleta (profissões)
  "💼": `${defs(lin("bc-b", WOOD, 0, 1), rad("bc-l", GOLD))}
    <path d="M22 15Q22 9 28 9H36Q42 9 42 15V18H37V15Q37 14 36 14H28Q27 14 27 15V18H22Z" fill="${WOOD[2]}"/>
    <rect x="5" y="17" width="54" height="40" rx="7" fill="url(#bc-b)"/>
    <path d="M5 30Q32 38 59 30" fill="none" stroke="${WOOD[2]}" stroke-width="2.4" opacity=".7"/>
    <rect x="27" y="29" width="10" height="9" rx="2.5" fill="url(#bc-l)"/>
    ${hl(15, 23, 7, 2.5, 0, 0.55)}`,

  // tênis (ações)
  "👟": `${defs(lin("sn-b", BLUE, 0, 1), lin("sn-s", WHITE, 0, 1))}
    <path d="M6 44Q6 36 12 34L22 30Q26 20 32 16L37 14Q41 22 48 28L56 32Q60 35 59 42L58 46H8Z" fill="url(#sn-b)"/>
    <path d="M5 44H59Q60 52 54 53H11Q5 53 5 44Z" fill="url(#sn-s)"/>
    <path d="M30 22L38 26M28 26L36 30M26 30L34 34" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M44 34Q50 38 57 38" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
    ${hl(14, 37, 5, 2, -15, 0.6)}`,

  // caixa (objetos)
  "📦": `${defs(lin("bx-f", ["#e8b57c", "#c98b4f", "#94592b"], 1, 1), lin("bx-t", ["#f6d2a4", "#e2ab70", "#c98b4f"], 0, 1))}
    <path d="M8 22L32 12L56 22L32 32Z" fill="url(#bx-t)"/>
    <path d="M8 22L32 32V58L8 47Z" fill="url(#bx-f)"/>
    <path d="M56 22L32 32V58L56 47Z" fill="#a8693a"/>
    <path d="M20 17L44 27V35L40 33.5V28.5L16 18.5Z" fill="#f2e1c4"/>
    <path d="M44 27L48 25.3V33L44 35Z" fill="#d9c4a0"/>
    ${hl(16, 34, 2, 6, -20, 0.4)}`,

  // bola de futebol (esportes)
  "⚽": `${defs(rad("fb-g", WHITE, 36, 28, 78))}
    <circle cx="32" cy="32" r="27" fill="url(#fb-g)"/>
    <path d="M32 22L41 28.5L37.5 39H26.5L23 28.5Z" fill="#2f2f39"/>
    <path d="M32 22V9 M41 28.5L53 24 M37.5 39L45 50 M26.5 39L19 50 M23 28.5L11 24" stroke="#2f2f39" stroke-width="2"/>
    <path d="M24 6.5L32 9L40 6.5Q32 3.5 24 6.5Z M55 20L53 24L57 33Q59 26 55 20Z M47 54L45 50L36 52Q42 56 47 54Z M17 54L19 50L28 52Q22 56 17 54Z M9 20L11 24L7 33Q5 26 9 20Z" fill="#2f2f39"/>
    ${hl(21, 17, 8, 4, -30, 0.7)}`,

  // pizza (comidas)
  "🍕": `${defs(lin("pz-c", ["#f7cf86", "#e3a24f", "#b9732c"], 0, 1), lin("pz-q", YELLOW, 0, 1), rad("pz-p", RED))}
    <path d="M32 60L6 12Q32 2 58 12Z" fill="url(#pz-q)"/>
    <path d="M4 11Q32 0 60 11L58 17Q32 7 6 17Z" fill="url(#pz-c)"/>
    <circle cx="24" cy="25" r="5" fill="url(#pz-p)"/><circle cx="40" cy="27" r="5" fill="url(#pz-p)"/><circle cx="32" cy="42" r="4.5" fill="url(#pz-p)"/>
    <path d="M44 38Q47 44 44 48" fill="none" stroke="${YELLOW[1]}" stroke-width="3" stroke-linecap="round"/>
    ${hl(22.5, 23.5, 1.8, 1.2)}${hl(38.5, 25.5, 1.8, 1.2)}${hl(20, 9, 8, 1.6, -8, 0.6)}`,

  // fantasminha (personagens)
  "👻": `${defs(rad("gh-g", WHITE, 36, 26, 80))}
    <path d="M10 30C10 16 20 6 32 6C44 6 54 16 54 30V56C54 59 51 60 49 58L44 54L39 58Q37 60 35 58L32 55L29 58Q27 60 25 58L20 54L15 58C13 60 10 59 10 56Z" fill="url(#gh-g)"/>
    <ellipse cx="24" cy="29" rx="3.6" ry="5" fill="#2f2f39"/><ellipse cx="40" cy="29" rx="3.6" ry="5" fill="#2f2f39"/>
    <circle cx="25.2" cy="27" r="1.3" fill="#fff"/><circle cx="41.2" cy="27" r="1.3" fill="#fff"/>
    <ellipse cx="32" cy="41" rx="4" ry="5" fill="#2f2f39"/>
    <ellipse cx="17" cy="37" rx="3.5" ry="2.2" fill="${PINK[1]}" opacity=".5"/><ellipse cx="47" cy="37" rx="3.5" ry="2.2" fill="${PINK[1]}" opacity=".5"/>
    ${hl(21, 15, 7, 3.5, -30, 0.85)}`,

  // ---------- Não Fale o Mesmo que Eu ----------
  // vida
  "❤️": `${defs(rad("lv-g", RED, 32, 22, 85))}
    <path d="M32 56C14 44 5 33 5 22C5 13 12 7 20 7C25.5 7 29.5 10 32 14.5C34.5 10 38.5 7 44 7C52 7 59 13 59 22C59 33 50 44 32 56Z" fill="url(#lv-g)"/>
    ${hl(17, 18, 7, 4.5, -30, 0.85)}${hl(46, 15, 3, 1.8, 20, 0.5)}`,

  // vida perdida
  "💔": `${defs(rad("bk-g", RED, 32, 22, 85))}
    <g transform="rotate(-8 30 30) translate(-2 0)">
      <path d="M31 53C14 42 5 32 5 22C5 13 12 7 20 7C25 7 28.5 9.5 31 13.5L27 23L33 30L27 39L31 53Z" fill="url(#bk-g)"/>
    </g>
    <g transform="rotate(8 34 30) translate(3 2)">
      <path d="M33 53L29 39L35 30L29 23L33 13.5C35.5 9.5 39 7 44 7C52 7 59 13 59 22C59 32 50 42 33 53Z" fill="url(#bk-g)"/>
    </g>
    ${hl(15, 17, 5, 3.5, -30, 0.8)}`,

  // máquina
  "🤖": `${defs(rad("rb-h", SILVER, 34, 24, 85), rad("rb-e", BLUE, 40, 35, 70), rad("rb-a", RED))}
    <path d="M32 6V13" stroke="${SILVER[2]}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="32" cy="6" r="4" fill="url(#rb-a)"/>
    <rect x="4" y="27" width="7" height="14" rx="3.5" fill="${SILVER[2]}"/>
    <rect x="53" y="27" width="7" height="14" rx="3.5" fill="${SILVER[2]}"/>
    <rect x="9" y="12" width="46" height="44" rx="14" fill="url(#rb-h)"/>
    <rect x="15" y="20" width="34" height="22" rx="10" fill="#2f2f39"/>
    <circle cx="25" cy="31" r="5" fill="url(#rb-e)"/><circle cx="39" cy="31" r="5" fill="url(#rb-e)"/>
    <circle cx="26.5" cy="29.5" r="1.6" fill="#fff"/><circle cx="40.5" cy="29.5" r="1.6" fill="#fff"/>
    <path d="M24 49H40" stroke="${SILVER[2]}" stroke-width="3" stroke-linecap="round"/>
    ${hl(19, 17, 8, 2.5, -10, 0.8)}`,

  // galeria (foto com moldura)
  "🖼️": `${defs(lin("gl-f", WOOD, 1, 1), lin("gl-s", BLUE, 0, 1), rad("gl-u", YELLOW), lin("gl-h", GREEN, 0, 1), lin("gl-b", ["#9fd2a5", "#5aa86a", "#2f7a45"], 0, 1))}
    <g transform="rotate(-8 34 30)">
      <rect x="14" y="10" width="44" height="36" rx="6" fill="${WHITE[1]}" opacity=".85"/>
    </g>
    <rect x="6" y="14" width="48" height="40" rx="7" fill="url(#gl-f)"/>
    <rect x="11" y="19" width="38" height="30" rx="3.5" fill="url(#gl-s)"/>
    <circle cx="40" cy="27" r="4.6" fill="url(#gl-u)"/>
    <path d="M11 49V42L21 32L31 41L36 37L49 47V49Z" fill="url(#gl-h)"/>
    <path d="M11 49V45Q24 39 33 44Q41 48 49 46V49Z" fill="url(#gl-b)"/>
    ${hl(16, 22, 4, 1.6, -15, 0.7)}${hl(14, 16.5, 8, 1.4, 0, 0.5)}`,
};
