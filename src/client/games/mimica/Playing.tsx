import { type FormEvent, useRef, useState } from "react";
import { MIMICA_LIMITS as L, getMimicaCategory, mimicaWordEmoji } from "../../../shared/games/mimica";
import { Emoji } from "../../components/Emoji";
import { Timer } from "../../components/Timer";
import { Avatar, Button, Card, cx } from "../../components/ui";
import { useCountdown } from "../../lib/useCountdown";
import type { MimicaProps } from "./MimicaGame";

function GuessFeed({ s, meId, player }: Pick<MimicaProps, "s" | "meId" | "player">) {
  if (s.guesses.length === 0) return <p className="text-center text-sm text-muted">Os chutes errados aparecem aqui.</p>;
  return (
    <ul className="flex flex-col-reverse gap-1.5">
      {s.guesses.map((g, i) => (
        <li key={i} className="flex animate-pop items-center gap-2 text-sm">
          <Avatar avatar={player(g.by)?.avatar ?? "❔"} size="sm" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-bold">{g.by === meId ? "Você" : player(g.by)?.name}:</span>{" "}
            <span className="text-muted line-through decoration-plum/60">{g.text}</span>
          </span>
          {g.close && <span className="rounded-full bg-mustard/30 px-2 py-0.5 text-xs font-bold">quase!</span>}
        </li>
      ))}
    </ul>
  );
}

export function Playing(props: MimicaProps) {
  const { s, meId } = props;
  const left = useCountdown(s.endsAt, s.serverNow);
  const total = s.config.seconds * 1000;
  return s.mimeId === meId ? <MimeView {...props} left={left} total={total} /> : <GuesserView {...props} left={left} total={total} />;
}

type ViewProps = MimicaProps & { left: number; total: number };

function MimeView({ s, meId, act, player, players, left, total }: ViewProps) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const others = players.filter((p) => p.connected && p.id !== meId);

  return (
    <>
      <div className="flex items-center gap-4">
        <Timer left={left} total={total} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Imite sem falar!</p>
          <p className="flex items-center gap-2 font-display text-3xl font-bold leading-tight">
            <Emoji e={mimicaWordEmoji(s.word, s.category)} className="shrink-0" native />
            <span className="min-w-0">{s.word}</span>
          </p>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-bold">Alguém acertou falando?</h3>
        <p className="mb-3 text-xs text-muted">Toque em quem acertou em voz alta.</p>
        <ul className="grid grid-cols-4 gap-2">
          {others.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setConfirm(p.id)}
                className={cx("flex w-full flex-col items-center gap-1 rounded-2xl p-1.5 transition active:scale-95", confirm === p.id ? "bg-sage/25 ring-2 ring-sage" : "bg-surface-2")}
              >
                <Avatar avatar={p.avatar} size="sm" online={p.connected} />
                <span className="w-full truncate text-center text-xs font-bold">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {confirm && (
          <div className="mt-3 flex animate-pop gap-2">
            <Button className="flex-1" onClick={() => act({ type: "award", playerId: confirm })}>
              <Emoji e="✅" /> {player(confirm)?.name} acertou
            </Button>
            <Button variant="soft" onClick={() => setConfirm(null)}>
              Não
            </Button>
          </div>
        )}
      </Card>

      <Card className="bg-surface-2 p-4">
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Chutes da galera</h3>
        <GuessFeed s={s} meId={meId} player={player} />
      </Card>

      <Button variant="ghost" className="self-center" onClick={() => act({ type: "give-up" })}>
        Desistir dessa palavra
      </Button>
    </>
  );
}

function GuesserView({ s, meId, isHost, act, player, left, total }: ViewProps) {
  const cat = getMimicaCategory(s.category);
  const mime = player(s.mimeId);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const myLast = [...s.guesses].reverse().find((g) => g.by === meId);

  function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    act({ type: "guess", text });
    setText("");
    inputRef.current?.focus();
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Timer left={left} total={total} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Quem imita</p>
          <div className="flex items-center gap-2">
            {mime && <Avatar avatar={mime.avatar} size="sm" online={mime.connected} />}
            <span className="truncate font-display text-xl font-bold">{mime?.name}</span>
          </div>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Categoria</p>
          <p className="flex items-center gap-1.5 font-display text-lg font-bold">
            <Emoji e={cat?.emoji ?? "🎲"} /> {cat?.name}
          </p>
        </div>
      </div>

      <form onSubmit={send} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, L.maxGuessLength))}
            placeholder="Seu chute…"
            aria-label="Seu chute"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="send"
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
          />
          <Button type="submit" size="lg" className="px-5" disabled={!text.trim()}>
            Chutar
          </Button>
        </div>
        {myLast && (
          <p key={s.guesses.length} className={cx("animate-pop text-center text-sm font-bold", myLast.close ? "text-mustard" : "text-plum")}>
            {myLast.close ? `"${myLast.text}" tá quase! Tenta de novo.` : `"${myLast.text}" não é.`}
          </p>
        )}
      </form>

      <Card className="bg-surface-2 p-4">
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Chutes da galera</h3>
        <GuessFeed s={s} meId={meId} player={player} />
      </Card>

      {isHost && (
        <Button variant="ghost" className="self-center" onClick={() => act({ type: "give-up" })}>
          Pular essa rodada
        </Button>
      )}
    </>
  );
}
