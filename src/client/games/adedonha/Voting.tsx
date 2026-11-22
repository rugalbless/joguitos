import { normalizeAnswer, rejectionKey, startsWithLetter } from "../../../shared/games/adedonha";
import { Avatar, Button, Pill, cx } from "../../components/ui";
import type { AdedonhaProps } from "./AdedonhaGame";

export function Voting({ s, meId, isHost, act, player }: AdedonhaProps) {
  const cat = s.votingIndex;
  const letter = s.letter ?? "";
  const answers = s.participants.map((id) => ({ id, text: s.answers[id]?.[cat] ?? "" }));

  // Prévia de repetidas (o servidor recalcula no final).
  const counts = new Map<string, number>();
  for (const a of answers) {
    const n = normalizeAnswer(a.text);
    if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
  }

  const done = s.votesDone.includes(meId);
  const plays = s.participants.includes(meId);
  const voters = s.participants.filter((id) => player(id)?.connected);
  const waiting = voters.filter((id) => !s.votesDone.includes(id));
  // Mais da metade dos OUTROS jogadores precisa votar "não vale" para anular.
  const needed = Math.floor(Math.max(1, s.participants.length - 1) / 2) + 1;

  return (
    <>
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
          Votação · {cat + 1} de {s.config.categories.length} · letra {letter}
        </p>
        <h2 className="text-3xl font-bold">{s.config.categories[cat]}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Alguma resposta não vale? Toque em <b className="text-plum">Não vale</b>. Com {needed} {needed === 1 ? "voto" : "votos"} ela é anulada.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {answers.map(({ id, text }, i) => {
          const p = player(id);
          const norm = normalizeAnswer(text);
          const auto = !norm
            ? s.passed?.[id]?.includes(cat)
              ? "não soube"
              : "em branco"
            : !startsWithLetter(text, letter)
              ? `não começa com ${letter}`
              : null;
          const rejectedBy = s.rejections[rejectionKey(cat, id)] ?? [];
          const iRejected = rejectedBy.includes(meId);
          const mine = id === meId;
          const annulled = !!auto || rejectedBy.length >= needed;

          return (
            <li
              key={id}
              className={cx("animate-pop rounded-blob border border-line bg-surface p-3 shadow-cozy", mine && "ring-2 ring-accent")}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <Avatar avatar={p?.avatar ?? "❔"} size="sm" online={!!p?.connected} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-muted">{mine ? "Sua resposta" : p?.name}</p>
                  <p className={cx("truncate font-display text-2xl font-bold leading-tight", annulled && "text-muted line-through decoration-2")}>
                    {text.trim() || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {auto && <Pill className="bg-plum/15 text-plum">{auto}</Pill>}
                  {!auto && (counts.get(norm) ?? 0) > 1 && <Pill className="bg-mustard/30 text-ink">repetida · 5 pts</Pill>}
                  {!auto && rejectedBy.length > 0 && (
                    <Pill className="bg-plum/15 text-plum">
                      {rejectedBy.length}/{needed} não vale
                    </Pill>
                  )}
                </div>
              </div>

              {!mine && !auto && plays && (
                <div role="radiogroup" aria-label={`A resposta de ${p?.name} vale?`} className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
                  <button
                    role="radio"
                    aria-checked={!iRejected}
                    onClick={() => iRejected && act({ type: "reject", target: id, reject: false })}
                    className={cx(
                      "h-10 rounded-xl font-display font-semibold transition active:scale-95",
                      !iRejected ? "bg-sage text-accent-ink shadow-cozy" : "text-muted",
                    )}
                  >
                    ✓ Vale
                  </button>
                  <button
                    role="radio"
                    aria-checked={iRejected}
                    onClick={() => !iRejected && act({ type: "reject", target: id, reject: true })}
                    className={cx(
                      "h-10 rounded-xl font-display font-semibold transition active:scale-95",
                      iRejected ? "bg-plum text-accent-ink shadow-cozy" : "text-muted",
                    )}
                  >
                    ✗ Não vale
                  </button>
                </div>
              )}
              {!mine && auto && <p className="mt-2 text-xs text-muted">Anulada automaticamente, não precisa votar.</p>}
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex flex-col gap-1">
        {plays && (
          <Button size="lg" className={cx("w-full", done && "bg-sage shadow-none")} disabled={done} onClick={() => act({ type: "vote-done" })}>
            {done ? "✓ Votos confirmados" : "Confirmar e ir pra próxima"}
          </Button>
        )}
        <p className="rounded-full bg-bg/90 px-3 py-1 text-center text-sm text-muted backdrop-blur">
          {waiting.length === 0 ? "Tudo certo!" : `Esperando ${waiting.map((id) => (id === meId ? "você" : (player(id)?.name ?? "?"))).join(", ")}`}
        </p>
      </div>
      {isHost && (
        <Button variant="ghost" className="self-center" onClick={() => act({ type: "force-next" })}>
          Pular espera
        </Button>
      )}
    </>
  );
}
