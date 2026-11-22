import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { GAMES } from "../../shared/games";
import { MURAL_LIMITS as L, type MuralPhoto, OCASIOES, UFS } from "../../shared/mural";
import { Emoji } from "../components/Emoji";
import { Layout } from "../components/Layout";
import { Button, cx } from "../components/ui";
import { muralApi, photoUrl, preparePhoto } from "../lib/mural";
import { usePageMeta } from "../lib/usePageMeta";

/** Inclinação fixa por foto (a mesma sempre), para o mural parecer colado à mão. */
function tilt(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 9) - 4) * 0.9;
}

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 864e5);
  if (d <= 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  return new Date(ts).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

const CARD_W = 190;

function Polaroid({
  photo,
  index,
  x,
  y,
  onLike,
  onReport,
}: { photo: MuralPhoto; index: number; x: number; y: number; onLike: () => void; onReport: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <li
      className="absolute"
      style={{ left: x - CARD_W / 2, top: y, width: CARD_W, transform: `translateY(-50%) rotate(${tilt(photo.id)}deg)` }}
    >
      <figure className="relative animate-[bob_6s_ease-in-out_infinite] rounded-md bg-surface p-2 pb-3 shadow-cozy" style={{ animationDelay: `${-index * 1.3}s` }}>
        {/* fita adesiva */}
        <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-3 rounded-sm bg-mustard/60" aria-hidden />
        <img
          src={photoUrl(photo.id)}
          alt={`Foto da galera: ${photo.occasion} em ${photo.city}, ${photo.uf}`}
          loading="lazy"
          draggable={false}
          className="aspect-[4/5] w-full rounded-sm bg-surface-2 object-cover"
        />
        <figcaption className="mt-2 px-1">
          <p className="font-display text-base font-bold leading-tight">{photo.occasion}</p>
          <p className="text-xs font-bold text-muted">
            {photo.city}, {photo.uf}
            {photo.game && ` · ${photo.game}`}
          </p>
          {photo.caption && <p className="mt-1 text-sm leading-snug">{photo.caption}</p>}
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={onLike}
              aria-pressed={photo.liked}
              aria-label={photo.liked ? "Descurtir" : "Curtir"}
              className="flex items-center gap-1 rounded-full px-2 py-1 font-display font-bold transition active:scale-90"
            >
              <Emoji e="❤️" className={cx("text-xl transition", !photo.liked && "opacity-35 grayscale")} />
              <span className="tabular-nums">{photo.likes}</span>
            </button>
            <span className="text-[11px] text-muted">{timeAgo(photo.createdAt)}</span>
          </div>
          {asking ? (
            <div className="mt-2 rounded-xl bg-surface-2 p-2 text-xs">
              <p>Aparece você e não quer? A foto sai do mural agora e a gente revisa.</p>
              <div className="mt-2 flex gap-2">
                <Button variant="soft" className="h-8 flex-1 bg-surface px-2 text-xs" onClick={onReport}>
                  Tirar do mural
                </Button>
                <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setAsking(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAsking(true)} className="mt-1 text-[11px] font-bold text-muted underline-offset-2 hover:underline">
              Aparece você? Pedir para tirar
            </button>
          )}
        </figcaption>
      </figure>
    </li>
  );
}

const field = "h-12 w-full rounded-2xl border-2 border-line bg-bg px-3 font-bold outline-none focus:border-accent";

function PostForm({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [occasion, setOccasion] = useState<string>(OCASIOES[0]);
  const [game, setGame] = useState("");
  const [caption, setCaption] = useState("");
  const [consentPeople, setConsentPeople] = useState(false);
  const [consentMinors, setConsentMinors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError(null);
      setImage(await preparePhoto(file));
    } catch {
      setError("Não consegui usar essa foto. Tenta outra?");
    }
  }

  const ready = image && city.trim() && uf && consentPeople && consentMinors;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !image) return;
    setBusy(true);
    setError(null);
    try {
      await muralApi.upload({ image, city, uf, occasion, caption, game: game || null, consentPeople, consentMinors });
      setSent(true);
      onPosted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stage/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-lg animate-[fade-up_0.35s_ease-out_both] overflow-y-auto rounded-t-blob bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-cozy sm:rounded-blob"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-6xl">
              <Emoji e="🎉" />
            </span>
            <h2 className="text-2xl font-bold">Foto no mural!</h2>
            <p className="text-muted">Valeu por compartilhar a jogatina!</p>
            <Button size="lg" className="mt-2 w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Postar foto</h2>
              <button type="button" onClick={onClose} className="px-2 text-2xl text-muted" aria-label="Fechar">
                ×
              </button>
            </div>

            <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
            <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={pick} />
            {image ? (
              <div className="relative">
                <img src={image} alt="Prévia da foto" className="max-h-72 w-full rounded-2xl object-cover" />
                <Button type="button" variant="soft" className="absolute bottom-2 right-2 h-9 px-3 text-sm" onClick={() => gallery.current?.click()}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="soft" className="h-24 flex-col" onClick={() => camera.current?.click()}>
                  <Emoji e="📷" className="text-3xl" />
                  Tirar foto
                </Button>
                <Button type="button" variant="soft" className="h-24 flex-col" onClick={() => gallery.current?.click()}>
                  <Emoji e="🖼️" className="text-3xl" />
                  Da galeria
                </Button>
              </div>
            )}

            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <input value={city} onChange={(e) => setCity(e.target.value.slice(0, L.maxCity))} placeholder="Cidade" aria-label="Cidade" className={field} />
              <select value={uf} onChange={(e) => setUf(e.target.value)} aria-label="Estado" className={field}>
                <option value="">UF</option>
                {UFS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-muted">Qual era a ocasião?</p>
              <div className="flex flex-wrap gap-1.5">
                {OCASIOES.map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => setOccasion(o)}
                    aria-pressed={occasion === o}
                    className={cx("rounded-full border-2 px-3 py-1 text-sm font-bold transition", occasion === o ? "border-accent bg-accent text-accent-ink" : "border-line text-muted")}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <select value={game} onChange={(e) => setGame(e.target.value)} aria-label="Jogo" className={field}>
              <option value="">Qual jogo? (opcional)</option>
              {GAMES.filter((g) => g.status === "available").map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, L.maxCaption))} placeholder="Legenda (opcional)" aria-label="Legenda" className={field} />

            <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3 text-sm">
              <label className="flex gap-2">
                <input type="checkbox" checked={consentPeople} onChange={(e) => setConsentPeople(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
                Todo mundo que aparece na foto concordou em ela ir para o mural.
              </label>
              <label className="flex gap-2">
                <input type="checkbox" checked={consentMinors} onChange={(e) => setConsentMinors(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
                Ninguém na foto é menor de idade sem autorização dos responsáveis.
              </label>
              <p className="text-xs text-muted">
                Fotos sem bom senso são apagadas. A localização guardada dentro da foto é apagada antes do envio.
              </p>
            </div>

            {error && <p className="text-center text-sm font-bold text-accent">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={!ready || busy}>
              {busy ? "Enviando…" : "Enviar para o mural"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Espaço do mural: as fotos ficam numa grade hexagonal ao redor do centro (onde ficam o título e o
// botão de postar), anel por anel. Cada foto ganha um pequeno desvio e inclinação para parecer colada à mão.
const CELL_W = 285; // distância entre fotos lado a lado
const CELL_H = 410; // distância entre fileiras (a polaroide tem ~360px de altura)
const CENTER = { w: 300, h: 320 };

/** Posição (relativa ao centro) da i-ésima foto: anel 1 tem 6 lugares, anel 2 tem 12… */
function slot(i: number) {
  let ring = 1;
  let first = 0;
  while (i >= first + 6 * ring) {
    first += 6 * ring;
    ring++;
  }
  const k = i - first; // posição dentro do anel
  // Coordenadas axiais de um anel hexagonal
  const dirs = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
  ];
  let q = 0;
  let r = -ring;
  for (let side = 0, step = 0; side < 6; side++) {
    for (let j = 0; j < ring; j++, step++) {
      if (step === k) return { x: (q + r / 2) * CELL_W, y: r * CELL_H, ring };
      q += dirs[side][0];
      r += dirs[side][1];
    }
  }
  return { x: 0, y: 0, ring };
}

function jitter(id: string, salt: number) {
  let h = salt;
  for (const c of id) h = (h * 33 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 25) - 12;
}

export function Mural() {
  usePageMeta("Mural da galera · Joguitos", { description: "Fotos das jogatinas da galera que joga Joguitos pelo Brasil." });
  const [photos, setPhotos] = useState<MuralPhoto[] | null>(null);
  const [posting, setPosting] = useState(false);
  const [more, setMore] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState<number | null>(null); // ângulo até o centro, quando ele sai da tela

  function reload() {
    muralApi
      .list()
      .then((r) => {
        setPhotos(r.photos);
        setMore(r.photos.length >= L.pageSize);
      })
      .catch(() => setPhotos((p) => p ?? []));
  }
  useEffect(reload, []);

  async function loadMore() {
    if (!photos?.length) return;
    const r = await muralApi.list(photos[photos.length - 1].createdAt);
    setPhotos([...photos, ...r.photos]);
    setMore(r.photos.length >= L.pageSize);
  }

  async function like(p: MuralPhoto) {
    // Atualiza na hora; o servidor confirma o número certo.
    setPhotos((list) => list?.map((x) => (x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)) ?? null);
    try {
      const r = await muralApi.like(p.id);
      setPhotos((list) => list?.map((x) => (x.id === p.id ? { ...x, ...r } : x)) ?? null);
    } catch {
      // sem conexão: deixa como estava
    }
  }

  async function report(p: MuralPhoto) {
    setPhotos((list) => list?.filter((x) => x.id !== p.id) ?? null);
    await muralApi.report(p.id).catch(() => {});
  }

  // Tamanho do "mundo": cresce com o número de anéis de fotos.
  const slots = (photos ?? []).map((_, i) => slot(i));
  const rings = Math.max(1, ...slots.map((s) => s.ring));
  const worldW = Math.max(1200, (rings * 2 + 1) * CELL_W + 200);
  const worldH = Math.max(1200, (rings * 2 + 1) * CELL_H + 300);
  const cx0 = worldW / 2;
  const cy0 = worldH / 2;

  /** Leva a tela até o centro (o botão de postar). */
  function goCenter(smooth = true) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: cx0 - el.clientWidth / 2, top: cy0 - el.clientHeight / 2, behavior: smooth ? "smooth" : "auto" });
  }

  // Começa no centro, e recentraliza quando o mundo muda de tamanho.
  useEffect(() => {
    goCenter(false);
    // goCenter usa o tamanho atual do mundo
  }, [worldW, worldH]);

  // Mostra a seta quando o centro some da tela, apontando para ele.
  function onScroll() {
    const el = scroller.current;
    const c = center.current;
    if (!el || !c) return;
    const v = el.getBoundingClientRect();
    const r = c.getBoundingClientRect();
    const visible = r.right > v.left + 40 && r.left < v.right - 40 && r.bottom > v.top + 40 && r.top < v.bottom - 40;
    if (visible) return setAway(null);
    const dx = r.left + r.width / 2 - (v.left + v.width / 2);
    const dy = r.top + r.height / 2 - (v.top + v.height / 2);
    setAway((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  }

  // No computador, dá para arrastar com o mouse (no celular o dedo já rola nos dois sentidos).
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("button, a, input, select, label")) return;
    const el = scroller.current!;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    scroller.current!.scrollTo(d.left - (e.clientX - d.x), d.top - (e.clientY - d.y));
  }
  const endDrag = () => (drag.current = null);

  const states = new Set(photos?.map((p) => p.uf));

  return (
    <Layout>
      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="fixed inset-0 z-0 cursor-grab overflow-auto overscroll-none [scrollbar-width:none] active:cursor-grabbing"
      >
        <div className="relative" style={{ width: worldW, height: worldH }}>
          {/* Centro: título, frases e o botão de postar */}
          <div
            ref={center}
            className="absolute flex flex-col items-center gap-3 rounded-blob bg-surface p-6 text-center shadow-cozy"
            style={{ left: cx0 - CENTER.w / 2, top: cy0 - CENTER.h / 2, width: CENTER.w }}
          >
            <span className="text-5xl">
              <Emoji e="📷" />
            </span>
            <h1 className="text-3xl font-bold leading-tight">Mural da galera</h1>
            <p className="text-sm text-muted">As jogatinas de quem joga Joguitos por aí. Arraste para ver as fotos!</p>
            {photos && photos.length > 0 && (
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
                {photos.length} {photos.length === 1 ? "foto" : "fotos"} · {states.size} {states.size === 1 ? "estado" : "estados"}
              </p>
            )}
            {photos?.length === 0 && <p className="text-sm font-bold">O mural está vazio. Seja o primeiro!</p>}
            <Button size="lg" className="w-full text-xl" onClick={() => setPosting(true)}>
              <Emoji e="📷" /> Postar foto
            </Button>
            {more && (
              <Button variant="ghost" className="h-8 text-sm" onClick={loadMore}>
                Carregar mais fotos
              </Button>
            )}
          </div>

          {photos === null && (
            <p className="absolute text-muted" style={{ left: cx0 - 60, top: cy0 + CENTER.h / 2 + 24 }}>
              Carregando…
            </p>
          )}

          <ul>
            {photos?.map((p, i) => (
              <Polaroid
                key={p.id}
                photo={p}
                index={i}
                x={cx0 + slots[i].x + jitter(p.id, 1)}
                y={cy0 + slots[i].y + jitter(p.id, 2)}
                onLike={() => like(p)}
                onReport={() => report(p)}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Seta de volta ao centro quando o botão de postar sai da tela */}
      {away !== null && (
        <button
          onClick={() => goCenter()}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 animate-pop items-center gap-2 rounded-full bg-accent px-5 py-3 font-display text-lg font-semibold text-accent-ink shadow-cozy"
        >
          <span className="inline-block transition-transform" style={{ transform: `rotate(${away}deg)` }} aria-hidden>
            ↑
          </span>
          Postar foto
        </button>
      )}

      {posting && <PostForm onClose={() => setPosting(false)} onPosted={reload} />}
    </Layout>
  );
}
