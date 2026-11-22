import type { Player } from "../../shared/protocol";
import { Emoji } from "./Emoji";
import { Avatar, cx } from "./ui";

/** `rank` (opcional) desempata quando o placar não basta: maior é melhor. Sem ele, vale o `score`. */
export type PodiumEntry = { player: Player; score: number; rank?: number };

/**
 * Colocação de cada um, com empate: quem tem a mesma pontuação fica na mesma posição,
 * e a seguinte pula (dois em 1º → o próximo é 3º). `entries` precisa vir ordenado do maior pro menor.
 */
export function placesOf(entries: PodiumEntry[]) {
  const key = (e: PodiumEntry) => e.rank ?? e.score;
  return entries.map((e) => entries.findIndex((o) => key(o) === key(e)));
}

// Ordem visual 2º, 1º, 3º. Sobem devagar, 3º → 2º → 1º, para criar suspense.
// `delay` é quando a coluna começa a subir. A pessoa cai em cima dela logo depois.
const SLOTS = [
  { place: 1, height: "h-28", delay: 2.2, medal: "🥈", tone: "bg-sky/70" },
  { place: 0, height: "h-40", delay: 3.8, medal: "🥇", tone: "bg-mustard" },
  { place: 2, height: "h-20", delay: 0.6, medal: "🥉", tone: "bg-plum/70" },
];

/**
 * Pódio animado com os 3 primeiros lugares. Empatados dividem o mesmo degrau.
 * Com `hideFirst`, a coluna do 1º lugar sobe com um "?" em cima (escondendo todos os empatados),
 * esperando a revelação.
 */
export function Podium({ entries, hideFirst = false, unit = "pts" }: { entries: PodiumEntry[]; hideFirst?: boolean; unit?: string }) {
  const places = placesOf(entries);
  const group = (place: number) => entries.filter((_, i) => places[i] === place);

  return (
    <div className="flex items-end justify-center gap-2 pt-24">
      {SLOTS.map(({ place, height, delay, medal, tone }) => {
        const people = group(place);
        if (people.length === 0) return <div key={place} className="w-1/3 max-w-32" />;
        const mystery = place === 0 && hideFirst;
        const tied = people.length > 1;
        return (
          <div key={place} className="flex w-1/3 max-w-32 flex-col items-center">
            {mystery ? (
              <div className="animate-drop-in flex flex-col items-center" style={{ animationDelay: `${delay + 1.2}s` }}>
                <span className="grid size-20 animate-float place-items-center rounded-full bg-surface-2 font-display text-5xl font-bold text-muted ring-4 ring-line">
                  ?
                </span>
                <span className="mt-1 font-bold text-muted">???</span>
                <span className="font-display text-lg font-bold text-muted">?? {unit}</span>
              </div>
            ) : (
              <div
                className="animate-drop-in flex w-full flex-col items-center"
                // O 1º lugar, quando aparece depois da revelação, cai na hora.
                style={{ animationDelay: place === 0 ? "0.2s" : `${delay + 1.2}s` }}
              >
                <span className="text-3xl">
                  <Emoji e={medal} />
                </span>
                <div className={cx("flex", tied && "-space-x-3")}>
                  {people.map((e) => (
                    <Avatar key={e.player.id} avatar={e.player.avatar} size={tied ? "sm" : place === 0 ? "lg" : "md"} online={e.player.connected} />
                  ))}
                </div>
                <span className="mt-1 line-clamp-2 w-full text-center text-sm font-bold leading-tight">{people.map((e) => e.player.name).join(" e ")}</span>
                {tied && <span className="text-xs font-bold text-muted">empate</span>}
                <span className="font-display text-lg font-bold tabular-nums">
                  {people[0].score} {unit}
                </span>
              </div>
            )}
            <div
              className={cx("mt-2 w-full origin-bottom animate-rise rounded-t-2xl shadow-cozy", height, tone)}
              style={{ animationDelay: `${delay}s` }}
            >
              <span className="block pt-2 text-center font-display text-3xl font-bold text-ink/70">{place + 1}º</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
