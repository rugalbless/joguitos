import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Emoji } from "./Emoji";
import { isMascot, mascotUrl } from "../../shared/mascots";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost";
  size?: "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold tracking-wide",
        "transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent",
        size === "lg" ? "h-14 px-6 text-lg" : "h-11 px-4 text-base",
        variant === "primary" &&
          "bg-accent text-accent-ink hover:brightness-105",
        variant === "soft" && "bg-surface-2 text-ink hover:brightness-[0.98]",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("rounded-blob border border-line bg-surface p-5 shadow-cozy", className)}
      {...props}
    />
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const isPhotoAvatar = (avatar: string) => avatar.startsWith("data:image/");

type AvatarProps = {
  /** Id de mascote oficial, foto (data URL) do mascote personalizado ou emoji antigo. */
  avatar: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** true: aro verde (conectado). false: sem aro e apagado (caiu). Sem a prop: aro neutro. */
  online?: boolean;
  /** Apaga sem mexer no aro (ex.: quem ainda não apertou PRONTO). */
  faded?: boolean;
};

export function Avatar({ avatar, size = "md", online, faded }: AvatarProps) {
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 transition",
        size === "sm" && "size-9 text-xl ring-2",
        size === "md" && "size-12 text-3xl ring-[3px]",
        size === "lg" && "size-20 text-5xl ring-4",
        size === "xl" && "size-24 text-6xl ring-4",
        online === true ? "ring-online" : "ring-line",
        online === false && "opacity-45 grayscale",
        faded && "opacity-45",
      )}
      aria-hidden
    >
      {isPhotoAvatar(avatar) || isMascot(avatar) ? (
        <img
          src={isMascot(avatar) ? mascotUrl(avatar) : avatar}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <Emoji e={avatar} className="size-[0.95em]! align-baseline" />
      )}
    </span>
  );
}

export { cx };
