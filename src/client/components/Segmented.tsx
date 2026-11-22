import { cx } from "./ui";

/** Botões lado a lado em que só um fica marcado. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cx(
            "h-10 rounded-xl font-display font-semibold transition active:scale-95",
            o.id === value ? "bg-surface text-ink shadow-cozy" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
