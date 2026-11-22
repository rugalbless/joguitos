import { useEffect, useState } from "react";

const TYPE_MS = 75;
const ERASE_MS = 40;
const HOLD_MS = 1600;

/**
 * Escreve uma palavra letra por letra, espera, apaga e escreve a próxima, em loop.
 * Para quem pediu menos movimento, só troca a palavra inteira a cada poucos segundos.
 */
export function Typewriter({ words, className = "" }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [erasing, setErasing] = useState(false);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const word = words[index % words.length];
    if (reduced) {
      setText(word);
      const t = setTimeout(() => setIndex((i) => i + 1), HOLD_MS + 800);
      return () => clearTimeout(t);
    }
    let t: ReturnType<typeof setTimeout>;
    if (!erasing && text === word) t = setTimeout(() => setErasing(true), HOLD_MS);
    else if (erasing && text === "") {
      setErasing(false);
      setIndex((i) => i + 1);
    } else if (erasing) t = setTimeout(() => setText(word.slice(0, text.length - 1)), ERASE_MS);
    else t = setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS);
    return () => clearTimeout(t);
  }, [text, erasing, index, words, reduced]);

  return (
    <span className={className}>
      {/* Leitores de tela leem a lista inteira, não letra por letra. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden>
        {text}
        <span className="ml-0.5 inline-block w-[3px] animate-[caret_1s_step-end_infinite] self-stretch bg-current align-[-0.1em]" style={{ height: "1em" }} />
      </span>
    </span>
  );
}
