import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ADEDONHA_LIMITS as L, startsWithLetter } from "../../../shared/games/adedonha";
import { Avatar, Button, Card, cx } from "../../components/ui";
import { Emoji } from "../../components/Emoji";
import type { AdedonhaProps } from "./AdedonhaGame";

const SEND_DELAY_MS = 400;

export function Answering({ s, meId, isHost, act, player }: AdedonhaProps) {
  const categories = s.config.categories;
  const letter = s.letter ?? "?";
  const stopping = s.stage === "stopping";

  // Rascunho local (o servidor guarda uma cópia, então recarregar a página não perde nada).
  const [drafts, setDrafts] = useState<string[]>(() => s.answers[meId] ?? categories.map(() => ""));
  const [passed, setPassed] = useState<number[]>(() => s.passed?.[meId] ?? []);
  const isDone = (i: number, d = drafts, p = passed) => !!d[i]?.trim() || p.includes(i);
  const [current, setCurrent] = useState(() => Math.max(0, categories.findIndex((_, i) => !isDone(i))));
  const inputRef = useRef<HTMLInputElement>(null);

  // Envio com debounce, para não mandar uma mensagem por tecla.
  const pending = useRef(new Map<number, string>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    for (const [index, text] of pending.current) act({ type: "answer", index, text });
    pending.current.clear();
  }, [act]);

  function edit(text: string) {
    const value = text.slice(0, L.maxAnswerLength);
    setDrafts((d) => d.map((v, i) => (i === current ? value : v)));
    // Escreveu numa categoria marcada como "Não sei": desmarca (o servidor faz o mesmo).
    if (value.trim() && passed.includes(current)) setPassed((p) => p.filter((i) => i !== current));
    pending.current.set(current, value);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SEND_DELAY_MS);
  }

  // Alguém gritou STOP: manda já o que estiver digitado.
  useEffect(() => {
    if (stopping) flush();
  }, [stopping, flush]);
  useEffect(() => flush, [flush]);

  function go(i: number) {
    flush();
    setCurrent(i);
    inputRef.current?.focus();
  }

  /** Próxima categoria ainda sem resposta depois da atual (dando a volta). Se não sobrar nenhuma, só avança. */
  function goNext(d = drafts, p = passed) {
    for (let step = 1; step < categories.length; step++) {
      const i = (current + step) % categories.length;
      if (!isDone(i, d, p)) return go(i);
    }
    go(isDone(current, d, p) ? (current + 1) % categories.length : current);
  }

  function confirm(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) goNext();
  }

  function dontKnow() {
    if (passed.includes(current)) {
      const p = passed.filter((i) => i !== current);
      setPassed(p);
      act({ type: "pass", index: current, passed: false });
      inputRef.current?.focus();
      return;
    }
    pending.current.delete(current);
    const d = drafts.map((v, i) => (i === current ? "" : v));
    const p = [...passed, current];
    setDrafts(d);
    setPassed(p);
    act({ type: "pass", index: current, passed: true });
    goNext(d, p);
  }

  const done = categories.filter((_, i) => isDone(i)).length;
  const allDone = done === categories.length;
  const value = drafts[current] ?? "";
  const currentPassed = passed.includes(current);
  const badLetter = value.trim() !== "" && !startsWithLetter(value, letter);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="grid size-24 shrink-0 animate-pop place-items-center rounded-[1.75rem] bg-accent font-display text-7xl font-bold leading-none text-accent-ink">
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
            Rodada {s.round} de {s.config.rounds}
          </p>
          <p className="font-display text-2xl font-bold leading-tight">Tudo com {letter}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-sage transition-[width] duration-300"
                style={{ width: `${(done / categories.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums text-muted">
              {done}/{categories.length}
            </span>
          </div>
        </div>
      </div>

      <div
        className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        role="tablist"
        aria-label="Categorias"
      >
        {categories.map((c, i) => {
          const filled = !!drafts[i].trim();
          const skipped = passed.includes(i);
          return (
            <button
              key={c}
              role="tab"
              aria-selected={i === current}
              onClick={() => go(i)}
              className={cx(
                "shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold transition",
                i === current
                  ? "bg-ink text-bg"
                  : filled
                    ? "bg-sage/25 text-ink"
                    : skipped
                      ? "bg-surface-2 text-muted line-through"
                      : "border border-line bg-surface text-muted",
              )}
            >
              {filled && i !== current ? "✓ " : ""}
              {c}
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <form onSubmit={confirm} className="flex flex-col gap-3">
          <div key={current} className="animate-pop">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">
              Categoria {current + 1} de {categories.length}
            </p>
            <label htmlFor="answer" className="block font-display text-3xl font-bold leading-tight">
              {categories[current]}
            </label>
          </div>
          <input
            id="answer"
            ref={inputRef}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="next"
            disabled={stopping}
            value={value}
            onChange={(e) => edit(e.target.value)}
            placeholder={currentPassed ? "Você não soube essa" : `${letter}…`}
            className="h-16 rounded-2xl border-2 border-line bg-bg px-4 text-2xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent disabled:opacity-60"
          />
          {badLetter && <p className="-mt-1 text-sm font-bold text-plum">Opa, não começa com {letter}!</p>}
          {currentPassed && !value.trim() && (
            <p className="-mt-1 text-sm text-muted">Lembrou de algo? É só digitar.</p>
          )}

          <Button type="submit" size="lg" disabled={stopping || !value.trim()}>
            Confirmar
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="soft" disabled={stopping} onClick={() => goNext()}>
              Pular
            </Button>
            <Button
              type="button"
              variant="soft"
              disabled={stopping}
              onClick={dontKnow}
              aria-pressed={currentPassed}
              className={cx(currentPassed && "ring-2 ring-muted/40")}
            >
              {currentPassed ? "Desfazer" : "Não sei"}
            </Button>
          </div>
        </form>
      </Card>

      <Button
        size="lg"
        className="h-16 text-3xl tracking-widest"
        disabled={!allDone || stopping}
        onClick={() => {
          flush();
          act({ type: "stop" });
        }}
      >
        <Emoji e="🛑" /> STOP!
      </Button>
      {!allDone && (
        <p className="-mt-2 text-center text-xs text-muted">O STOP libera quando você responder ou passar todas.</p>
      )}

      <div className="rounded-blob bg-surface-2 p-4">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">A galera</p>
        <ul className="flex flex-wrap gap-3">
          {s.participants
            .filter((id) => id !== meId)
            .map((id) => {
              const p = player(id);
              return (
                <li key={id} className="flex items-center gap-2">
                  <Avatar avatar={p?.avatar ?? "❔"} size="sm" online={!!p?.connected} />
                  <span className="text-sm font-bold tabular-nums">
                    {s.progress[id] ?? 0}/{categories.length}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>

      {isHost && !stopping && (
        <Button variant="ghost" className="self-center" onClick={() => act({ type: "force-stop" })}>
          Encerrar rodada agora
        </Button>
      )}

      {stopping && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-bg/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="animate-stamp rounded-3xl border-8 border-accent px-8 py-4 font-display text-7xl font-bold text-accent">
              STOP!
            </p>
            <p className="mt-6 text-lg font-bold">
              {s.stoppedBy === meId ? "Você" : (player(s.stoppedBy ?? "")?.name ?? "Alguém")} gritou STOP
            </p>
            <p className="text-muted">Juntando as respostas…</p>
          </div>
        </div>
      )}
    </>
  );
}
