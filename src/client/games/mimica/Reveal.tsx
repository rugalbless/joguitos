import { useEffect, useState } from "react";
import { MIMICA_CATEGORIES, getMimicaCategory, mimicaWordEmoji } from "../../../shared/games/mimica";
import { Emoji } from "../../components/Emoji";
import { Avatar, Button } from "../../components/ui";
import { playTick } from "../../lib/sound";
import type { MimicaProps } from "./MimicaGame";

const SPIN_MS = 1700;

/**
 * Caça-níquel: passa palavras das categorias escolhidas, cada vez mais devagar, até parar na sorteada.
 * Roda de novo quando a palavra muda (o mímico trocou).
 */
function useSlot(word: string, categories: readonly string[]) {
  const [shown, setShown] = useState<{ text: string; emoji: string } | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pool = MIMICA_CATEGORIES.filter((c) => categories.includes(c.id)).flatMap((c) => c.words.map(([text, emoji]) => ({ text, emoji })));
    setDone(false);
    if (reduced) {
      setDone(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const t0 = performance.now();
    const step = () => {
      const p = (performance.now() - t0) / SPIN_MS;
      if (p >= 1) {
        setDone(true);
        return;
      }
      setShown(pool[Math.floor(Math.random() * pool.length)]);
      playTick();
      timer = setTimeout(step, 50 + p * p * 260); // desacelera
    };
    step();
    return () => clearTimeout(timer);
  }, [word, categories]);
  return { shown, done };
}

export function Reveal({ s, meId, isHost, act, player }: MimicaProps) {
  const mime = player(s.mimeId);
  const isMime = s.mimeId === meId;
  const cat = getMimicaCategory(s.category);

  if (!isMime) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Rodada {s.round} de {s.config.rounds}
        </p>
        <div className="animate-reveal">
          <span className="block animate-glow rounded-full">{mime && <Avatar avatar={mime.avatar} size="xl" online={mime.connected} />}</span>
        </div>
        <h2 className="text-3xl font-bold">{mime?.name ?? "Alguém"} vai imitar!</h2>
        <p className="text-muted">Tá vendo a palavra no celular… prepara o chute!</p>
        {isHost && (
          <Button variant="ghost" onClick={() => act({ type: "give-up" })}>
            Pular essa rodada
          </Button>
        )}
      </div>
    );
  }

  return <MimeReveal s={s} act={act} emoji={mimicaWordEmoji(s.word, s.category)} categoryName={cat?.name ?? ""} />;
}

function MimeReveal({ s, act, emoji, categoryName }: Pick<MimicaProps, "s" | "act"> & { emoji: string; categoryName: string }) {
  const { shown, done } = useSlot(s.word ?? "", s.config.categories);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Você vai imitar</p>
        <p className="text-sm text-muted">Não mostra pra ninguém!</p>
      </div>

      <div className="relative grid min-h-64 w-full place-items-center overflow-hidden rounded-blob bg-surface p-6 shadow-cozy ring-1 ring-line">
        {done ? (
          <div key={s.word} className="flex animate-reveal flex-col items-center gap-3">
            <span className="text-7xl">
              <Emoji e={emoji} native />
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-muted">{categoryName}</span>
            <p className="font-display text-4xl font-bold leading-tight text-balance">{s.word}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-60 blur-[1px]">
            <span className="text-6xl">
              <Emoji e={shown?.emoji ?? "🎲"} native />
            </span>
            <p className="font-display text-3xl font-bold">{shown?.text ?? "…"}</p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="w-full text-2xl" disabled={!done} onClick={() => act({ type: "begin" })}>
          Valendo!
        </Button>
        <Button variant="soft" disabled={!done || s.swapsLeft <= 0} onClick={() => act({ type: "swap-word" })}>
          {s.swapsLeft > 0 ? "Não conheço, trocar palavra" : "Já trocou a palavra"}
        </Button>
      </div>
      <p className="text-xs text-muted">O cronômetro só começa quando você apertar Valendo.</p>
    </div>
  );
}
