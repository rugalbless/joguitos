import { useEffect, useRef, useState } from "react";
import { shareRanking } from "../lib/shareRanking";
import { playDrumroll, playFanfare, playReveal, playSample, preloadSample } from "../lib/sound";
import { Confetti } from "./Confetti";
import { DrumRoll } from "./DrumRoll";
import { Emoji } from "./Emoji";
import { Podium, type PodiumEntry, placesOf } from "./Podium";
import { Avatar, Button } from "./ui";

/** Destaque do vencedor mostrado durante os tambores (ex.: a melhor rodada na Adedonha). */
export type WinnerHighlight = { label: string; title: string; chips?: string[] };

type Props = {
  /** Nome do jogo, para o card de compartilhar. */
  game: string;
  /** Ordenado do melhor pro pior. */
  entries: PodiumEntry[];
  /** Linha pequena acima de "Ranking final" (ex.: "3 rodadas · letras A, M, P"). */
  subtitle: string;
  /** Unidade do placar: "pts", "vidas"… */
  unit?: string;
  highlight?: WinnerHighlight | null;
  isHost: boolean;
  onRestart: () => void;
};

/** Rufar gravado (public/sounds). A batida final dele acontece em DRUM_HIT_MS. */
const DRUM_URL = "/sounds/drumroll.mp3";
const DRUM_HIT_MS = 5100;

/**
 * Etapas da revelação, em ms desde que a tela abriu:
 * pódio sobe (3º, 2º e o "?" do 1º) → tela escurece com "E o primeiro lugar vai para…"
 * → tambores → placar do vencedor → destaque → quem é (prato!) → placar completo.
 */
// O 1º lugar aparece exatamente na batida final do rufar (drums + DRUM_HIT_MS).
const STEPS = { dark: 6200, drums: 7600, points: 8900, best: 10800, reveal: 7600 + DRUM_HIT_MS, done: 7600 + DRUM_HIT_MS + 4300 } as const;
type Step = "podium" | keyof typeof STEPS;
const ORDER: Step[] = ["podium", "dark", "drums", "points", "best", "reveal", "done"];
const at = (step: Step, current: Step) => ORDER.indexOf(current) >= ORDER.indexOf(step);

/** Ranking final igual em todos os jogos: pódio, suspense com tambores e revelação do 1º lugar. */
export function FinalReveal({ game, entries, subtitle, unit = "pts", highlight, isHost, onRestart }: Props) {
  // Quem ficou fora do pódio (4º em diante, contando empates).
  const places = placesOf(entries);
  const rest = entries.map((e, i) => ({ ...e, place: places[i] })).filter((e) => e.place >= 3);
  const top = entries[0]?.score ?? 0;
  const winners = entries.filter((e) => e.score === top);

  const [step, setStep] = useState<Step>(entries.length ? "podium" : "done");
  const stopDrums = useRef<() => void>(() => {});
  const revealSound = useRef<() => void>(() => playReveal());
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!entries.length) return;
    void preloadSample(DRUM_URL);
    const timers = (Object.entries(STEPS) as [Step, number][]).map(([name, ms]) => setTimeout(() => setStep(name), ms));
    return () => {
      timers.forEach(clearTimeout);
      stopDrums.current();
    };
    // A sequência roda uma vez, quando a tela abre.
  }, []);

  useEffect(() => {
    if (step === "drums") {
      // Rufar gravado; se não carregar, cai no rufar sintetizado.
      let usedSample = false;
      void playSample(DRUM_URL).then((stop) => {
        // Pularam a revelação enquanto o áudio carregava: não começa a tocar.
        if (stepRef.current === "done") return stop?.();
        if (stop) {
          usedSample = true;
          stopDrums.current = stop;
        } else stopDrums.current = playDrumroll((STEPS.reveal - STEPS.drums) / 1000);
      });
      revealSound.current = () => (usedSample ? playFanfare() : (stopDrums.current(), playReveal()));
    }
    if (step === "reveal") revealSound.current();
  }, [step]);

  const [sharing, setSharing] = useState(false);
  async function share() {
    setSharing(true);
    try {
      await shareRanking(
        game,
        subtitle,
        unit,
        entries.map((e, i) => ({ name: e.player.name, avatar: e.player.avatar, handle: e.player.handle, score: e.score, place: places[i] })),
      );
    } finally {
      setSharing(false);
    }
  }

  function skip() {
    stopDrums.current();
    setStep("done");
  }

  const done = step === "done";

  return (
    <>
      {/* Painel mais escuro atrás do ranking: a gradezinha do fundo não aparece por trás do pódio. */}
      <section className="flex flex-col gap-4 rounded-blob bg-surface-2 p-4 pb-5 shadow-cozy">
        <div className="animate-fade-up text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">{subtitle}</p>
          <h2 className="text-3xl font-bold">Ranking final</h2>
        </div>

        <Podium entries={entries} hideFirst={!done} unit={unit} />

        {done && rest.length > 0 && (
          <div className="animate-fade-up rounded-2xl bg-surface p-4 [animation-delay:0.9s]">
            <ol className="flex flex-col gap-2">
              {rest.map((e) => (
                <li key={e.player.id} className="flex items-center gap-3">
                  <span className="w-6 text-center font-display text-muted">{e.place + 1}º</span>
                  <Avatar avatar={e.player.avatar} size="sm" online={e.player.connected} />
                  <span className="flex-1 truncate font-bold">{e.player.name}</span>
                  <span className="font-display font-bold tabular-nums">
                    {e.score} <span className="text-xs text-muted">{unit}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {done && (
        <>
          <Button variant="soft" size="lg" className="animate-fade-up [animation-delay:1s]" disabled={sharing} onClick={share}>
            <Emoji e="🎉" /> {sharing ? "Preparando…" : "Compartilhar ranking"}
          </Button>

          {isHost ? (
            <Button size="lg" className="animate-fade-up [animation-delay:1.2s]" onClick={onRestart}>
              Jogar de novo
            </Button>
          ) : (
            <p className="animate-fade-up text-center text-muted [animation-delay:1.2s]">O anfitrião decide se vai ter revanche</p>
          )}
        </>
      )}

      {at("dark", step) && !done && (
        <div className="fixed inset-0 z-30 flex animate-fade-in flex-col items-center justify-center gap-6 overflow-hidden bg-stage/95 px-6 text-center text-stage-ink [animation-duration:1.4s]">
          {/* Holofote */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[70vh] w-[140vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--mustard)_22%,transparent),transparent_65%)]" />

          {!at("reveal", step) ? (
            <>
              <p className="animate-fade-up font-display text-2xl font-bold">
                E o primeiro lugar vai para
                {[0, 1, 2].map((i) => (
                  <span key={i} className="animate-[dot_1.6s_ease-out_both]" style={{ animationDelay: `${0.9 + i * 0.45}s` }}>
                    .
                  </span>
                ))}
              </p>

              {at("drums", step) && <DrumRoll className="w-40 animate-fade-up" />}

              <div className="flex min-h-40 flex-col items-center gap-4">
                {at("points", step) && (
                  <div className="animate-fade-up">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">Com</p>
                    <p className="font-display text-6xl font-bold tabular-nums text-mustard">
                      <CountUp to={top} ms={1800} /> <span className="text-3xl">{unit}</span>
                    </p>
                  </div>
                )}
                {at("best", step) && highlight && (
                  <div className="animate-fade-up max-w-sm">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">{highlight.label}</p>
                    <p className="font-display text-xl font-bold">{highlight.title}</p>
                    {highlight.chips && highlight.chips.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                        {highlight.chips.slice(0, 4).map((h, i) => (
                          <span
                            key={h + i}
                            className="animate-pop rounded-full bg-stage-ink/10 px-3 py-1 text-sm font-bold"
                            style={{ animationDelay: `${0.4 + i * 0.25}s` }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Confetti />
              <div className="flex animate-reveal flex-col items-center gap-3">
                <span className="text-6xl">
                  <Emoji e="👑" />
                </span>
                <div className="flex gap-3">
                  {winners.map((w) => (
                    <span key={w.player.id} className="animate-glow rounded-full">
                      <Avatar avatar={w.player.avatar} size="xl" />
                    </span>
                  ))}
                </div>
                <p className="font-display text-5xl font-bold leading-tight">{winners.map((w) => w.player.name).join(" e ")}!</p>
                <span className="rounded-full bg-mustard px-4 py-1 font-display text-lg font-bold text-stage">
                  {winners.length > 1 ? "Empate" : "Campeão"} · {top} {unit}
                </span>
              </div>
            </>
          )}

          <button onClick={skip} className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-sm font-bold opacity-50">
            Pular
          </button>
        </div>
      )}
    </>
  );
}

/** Número subindo de 0 até `to`, desacelerando no fim. */
function CountUp({ to, ms }: { to: number; ms: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{n}</>;
}
