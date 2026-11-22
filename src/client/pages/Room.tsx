import { type ChangeEvent, type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { GAMES, getGame } from "../../shared/games";
import { LIMITS, cleanHandle, isValidRoomCode } from "../../shared/protocol";
import { mascotUrl } from "../../shared/mascots";
import { GAME_SCREENS } from "../games";
import { Layout } from "../components/Layout";
import { Scoreboard } from "../components/Scoreboard";
import { Emoji } from "../components/Emoji";
import { Avatar, Button, Card, cx, isPhotoAvatar } from "../components/ui";
import { photoToAvatar } from "../lib/photo";
import { usePageMeta } from "../lib/usePageMeta";
import { AVATARS, type Profile, useProfile } from "../lib/profile";
import { type RoomApi, useRoom } from "../lib/useRoom";

export function RoomPage() {
  const { code = "" } = useParams();
  if (!isValidRoomCode(code)) return <Navigate to="/" replace />;
  return <RoomInner code={code} />;
}

function RoomInner({ code }: { code: string }) {
  usePageMeta(`Sala ${code} · Joguitos`, { noindex: true });
  const [profile, updateProfile] = useProfile();
  const [editing, setEditing] = useState(!profile.name);
  const room = useRoom(code, profile);
  const { state, status, error } = room;

  // O aro verde em volta do seu mascote indica que você está conectado.
  const header = profile.name && !editing && (
    <button
      onClick={() => setEditing(true)}
      className={cx("rounded-full", status !== "open" && "animate-pulse")}
      aria-label={`Editar perfil (${status === "open" ? "conectado" : "reconectando"})`}
      title={status === "open" ? "Conectado" : "Reconectando…"}
    >
      <Avatar avatar={profile.avatar} size="md" online={status === "open"} status />
    </button>
  );

  if (status === "kicked") {
    return (
      <Layout>
        <Card className="text-center">
          <p className="text-5xl">
            <Emoji e="🚪" />
          </p>
          <h1 className="mt-2 text-2xl font-bold">Você saiu da sala</h1>
          <Link to="/" className="mt-4 inline-block font-bold text-accent">
            Voltar ao início
          </Link>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout right={header}>
      {editing || !profile.name ? (
        <ProfileForm
          profile={profile}
          onSave={(p) => {
            updateProfile(p);
            setEditing(false);
          }}
        />
      ) : !state ? (
        <p className="py-20 text-center text-muted">Entrando na sala…</p>
      ) : state.phase === "lobby" ? (
        <Lobby room={{ ...room, state }} />
      ) : state.phase === "playing" ? (
        <Playing room={{ ...room, state }} />
      ) : (
        <Results room={{ ...room, state }} />
      )}

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mx-auto max-w-md animate-pop rounded-2xl bg-ink px-4 py-3 text-center font-bold text-bg shadow-cozy"
        >
          {error}
        </div>
      )}
    </Layout>
  );
}

type WithState = { room: RoomApi & { state: NonNullable<RoomApi["state"]> } };

function ProfileForm({ profile, onSave }: { profile: Profile; onSave: (p: Omit<Profile, "id">) => void }) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [handle, setHandle] = useState(profile.handle ? `@${profile.handle}` : "");
  const [photo, setPhoto] = useState(profile.photo ?? (isPhotoAvatar(profile.avatar) ? profile.avatar : undefined));
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await photoToAvatar(file);
      setPhoto(data);
      setAvatar(data);
      setPhotoError(null);
    } catch {
      setPhotoError("Não consegui usar essa foto. Tenta outra?");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) onSave({ name: name.trim(), avatar, photo, handle: cleanHandle(handle) });
  }

  const usingPhoto = !!photo && avatar === photo;

  return (
    <Card className="animate-pop">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar avatar={avatar} size="xl" />
          <h1 className="text-2xl font-bold">Como você quer ser chamado?</h1>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, LIMITS.maxNameLength))}
          placeholder="Digite aqui"
          aria-label="Como você quer ser chamado"
          autoComplete="nickname"
          enterKeyHint="done"
          className="h-14 rounded-2xl border-2 border-line bg-bg px-4 text-center text-xl font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
        />
        <label className="-mt-2 flex flex-col gap-1">
          <span className="text-center text-xs font-bold text-muted">Seu @ do Instagram (opcional, pra te marcarem no ranking)</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/\s/g, "").slice(0, 31))}
            placeholder="@seuperfil"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            className="h-11 rounded-2xl border-2 border-line bg-bg px-4 text-center font-bold outline-none placeholder:font-semibold placeholder:text-muted/60 focus:border-accent"
          />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-muted">Escolha seu mascote</legend>
          <div className="grid grid-cols-8 gap-1.5 px-0.5">
            {AVATARS.map((a, i) => (
              <button
                type="button"
                key={a}
                onClick={() => setAvatar(a)}
                aria-pressed={a === avatar}
                aria-label={`Mascote ${i + 1}`}
                className={cx(
                  "aspect-square overflow-hidden rounded-full bg-surface-2 transition active:scale-90",
                  a === avatar ? "scale-110 ring-2 ring-accent" : "ring-1 ring-line",
                )}
              >
                <img src={mascotUrl(a)} alt="" className="size-full object-cover" draggable={false} loading="lazy" />
              </button>
            ))}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          <div
            className={cx(
              "mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed p-2 transition",
              usingPhoto ? "border-accent bg-accent/10" : "border-line",
            )}
          >
            {photo ? (
              <button type="button" onClick={() => setAvatar(photo)} aria-pressed={usingPhoto} aria-label="Usar minha foto" className="rounded-full">
                <Avatar avatar={photo} size="md" />
              </button>
            ) : (
              <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-2xl">
                <Emoji e="📷" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold">Mascote personalizado</p>
              <p className="text-xs text-muted">{photo ? "Toque na foto pra usar" : "Uma foto sua, do pet, do que quiser"}</p>
            </div>
            <Button type="button" variant="soft" onClick={() => fileRef.current?.click()}>
              {photo ? "Trocar" : "Escolher"}
            </Button>
          </div>
          {photoError && <p className="mt-2 text-sm font-bold text-plum">{photoError}</p>}
        </fieldset>
        <Button size="lg" type="submit" disabled={!name.trim()}>
          Bora!
        </Button>
      </form>
    </Card>
  );
}

function Lobby({ room }: WithState) {
  const { state, isHost, send, me } = room;
  const selected = getGame(state.gameId);

  // Veio do botão "Jogar" da página de um jogo: o anfitrião já entra com ele escolhido.
  const [params, setParams] = useSearchParams();
  const wanted = params.get("jogo");
  useEffect(() => {
    if (!wanted) return;
    const done = state.gameId === wanted || (state.hostId && !isHost) || getGame(wanted)?.status !== "available";
    if (done) setParams({}, { replace: true });
    else if (isHost && state.phase === "lobby") send({ type: "select-game", gameId: wanted });
  }, [wanted, isHost, state.phase, state.gameId, send, setParams]);
  const online = state.players.filter((p) => p.connected).length;

  return (
    <>
      <RoomCodeCard code={state.code} />

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Na sala</h2>
          <span className="text-sm text-muted">
            {online}/{LIMITS.maxPlayers}
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {state.players.map((p) => (
            <li key={p.id} className="flex animate-pop flex-col items-center gap-1 text-center">
              <div className="relative">
                <Avatar avatar={p.avatar} online={p.connected} />
                {state.hostId === p.id && (
                  <span className="absolute -right-1.5 -top-2.5 text-lg" title="Anfitrião">
                    <Emoji e="👑" label="Anfitrião" />
                  </span>
                )}
              </div>
              <span className={cx("w-full truncate text-sm font-bold", p.id === me?.id && "text-accent")}>
                {p.name}
              </span>
              {isHost && p.id !== me?.id && (
                <button className="text-xs text-muted underline" onClick={() => send({ type: "kick", playerId: p.id })}>
                  remover
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {isHost ? (
        <Card>
          <h2 className="mb-3 text-xl font-bold">Escolha o jogo</h2>
          <div className="flex flex-col gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                disabled={g.status !== "available"}
                onClick={() => send({ type: "select-game", gameId: g.id })}
                className={cx(
                  "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition disabled:opacity-50",
                  state.gameId === g.id ? "border-accent bg-accent/10" : "border-transparent bg-surface-2",
                )}
              >
                <span className="text-3xl">
                  <Emoji e={g.emoji} />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{g.name}</span>
                  <span className="block text-sm text-muted">
                    {g.status === "available" ? `${g.minPlayers}–${g.maxPlayers} pessoas` : "em breve"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={!selected || online < selected.minPlayers}
            onClick={() => send({ type: "start" })}
          >
            {selected ? `Começar ${selected.name}` : "Escolha um jogo"}
          </Button>
        </Card>
      ) : (
        <Card className="text-center">
          <p className="text-4xl">
            <Emoji e={selected?.emoji ?? "⏳"} />
          </p>
          <p className="mt-2 font-bold">
            {selected ? `Próximo jogo: ${selected.name}` : "Esperando o anfitrião escolher o jogo…"}
          </p>
        </Card>
      )}

      {state.players.some((p) => p.score !== 0) && (
        <Card>
          <h2 className="mb-3 text-xl font-bold">Placar geral</h2>
          <Scoreboard players={state.players} meId={me?.id ?? ""} />
        </Card>
      )}
    </>
  );
}

function RoomCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/sala/${code}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Joguitos", text: `Entra na minha sala: ${code}`, url });
        return;
      }
      await copyText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <Card className="flex items-center justify-between gap-4 bg-surface-2">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Código da sala</p>
        <p className="font-display text-5xl font-bold tracking-[0.2em]">{code}</p>
      </div>
      <Button variant="primary" onClick={share}>
        {copied ? "Copiado!" : "Convidar"}
      </Button>
    </Card>
  );
}

/** `navigator.clipboard` só existe em HTTPS/localhost; no IP da rede local usa o método antigo. */
async function copyText(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
}

function Playing({ room }: WithState) {
  const Screen = room.state.gameId ? GAME_SCREENS[room.state.gameId] : undefined;
  if (!Screen) return <p className="text-center text-muted">Jogo não encontrado.</p>;
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted">Carregando o jogo…</p>}>
      <Screen room={room} />
    </Suspense>
  );
}

function Results({ room }: WithState) {
  const { state, isHost, send, me } = room;
  return (
    <>
      <Card className="text-center">
        <p className="text-6xl">
          <Emoji e="🎉" />
        </p>
        <h1 className="mt-2 text-3xl font-bold">Fim de jogo!</h1>
      </Card>
      <Card>
        <Scoreboard players={state.players} meId={me?.id ?? ""} />
      </Card>
      {isHost ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="lg" onClick={() => send({ type: "back-to-lobby" })}>
            Voltar pro lobby
          </Button>
          <Button size="lg" variant="soft" onClick={() => send({ type: "reset-scores" })}>
            Zerar placar
          </Button>
        </div>
      ) : (
        <p className="text-center text-muted">O anfitrião decide o próximo jogo.</p>
      )}
    </>
  );
}
