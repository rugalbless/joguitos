import { useEffect, useRef } from "react";
import { playTick } from "../lib/sound";
import { cx } from "./ui";

/** Anel do cronômetro: esvazia conforme o tempo passa e fica vermelho nos últimos 10 segundos. */
export function Timer({ left, total, size = "lg" }: { left: number; total: number; size?: "md" | "lg" }) {
  const secs = Math.ceil(left / 1000);
  const p = total > 0 ? left / total : 0;
  const R = 44;
  const C = 2 * Math.PI * R;
  const urgent = secs <= 10;

  // Tique nos últimos 5 segundos.
  const last = useRef(secs);
  useEffect(() => {
    if (secs !== last.current && secs <= 5 && secs > 0) playTick(secs <= 3);
    last.current = secs;
  }, [secs]);

  return (
    <div className={cx("relative grid shrink-0 place-items-center", size === "lg" ? "size-36" : "size-24", secs <= 5 && secs > 0 && "animate-pulse")}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-surface-2" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          className={cx("transition-[stroke-dashoffset] duration-200 ease-linear", urgent ? "stroke-plum" : "stroke-accent")}
        />
      </svg>
      <span className={cx("font-display font-bold tabular-nums", size === "lg" ? "text-5xl" : "text-3xl", urgent && "text-plum")}>{secs}</span>
    </div>
  );
}
