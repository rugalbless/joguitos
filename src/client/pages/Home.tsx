import { type FormEvent, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { GAMES } from "../../shared/games";
import { isValidRoomCode } from "../../shared/protocol";
import { Bouncers } from "../components/Bouncers";
import { Clover } from "../components/BrandMark";
import { COFFEE_URL, GITHUB_URL } from "../lib/links";
import { Layout } from "../components/Layout";
import { Emoji } from "../components/Emoji";
import { Button, Card, Pill, cx } from "../components/ui";
import { generateRoomCode, normalizeRoomCode } from "../lib/room-code";

export function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const obstacles = useMemo(() => [titleRef], []);

  function join(e: FormEvent) {
    e.preventDefault();
    if (isValidRoomCode(code)) navigate(`/sala/${code}`);
  }

  return (
    <div className="relative">
      <Layout>
        <h1 className="sr-only">Joguitos</h1>

        <section ref={heroRef} className="relative overflow-hidden rounded-blob bg-accent px-6 py-16 text-accent-ink shadow-cozy">
          <Bouncers area={heroRef} obstacles={obstacles} />
          <h2 ref={titleRef} className="relative mx-auto max-w-[14ch] text-balance text-center text-4xl font-bold leading-tight sm:text-5xl">
            Chama a galera, pega o celular.
          </h2>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Criar uma sala</h2>
            <p className="text-muted">Você vira o anfitrião e compartilha o código com a galera.</p>
            <Button size="lg" className="mt-auto" onClick={() => navigate(`/sala/${generateRoomCode()}`)}>
              Criar sala
            </Button>
          </Card>

          <Card>
            <form onSubmit={join} className="flex h-full flex-col gap-3">
              <h2 className="text-xl font-bold">Entrar numa sala</h2>
              <label htmlFor="code" className="text-muted">
                Digite o código de 4 letras.
              </label>
              <div className="mt-auto flex gap-2">
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
                  placeholder="ABCD"
                  autoCapitalize="characters"
                  autoComplete="off"
                  inputMode="text"
                  className="h-14 w-full min-w-0 rounded-2xl border-2 border-line bg-bg px-4 text-center font-display text-2xl font-bold uppercase tracking-[0.4em] outline-none placeholder:text-line focus:border-accent"
                />
                <Button size="lg" type="submit" disabled={!isValidRoomCode(code)}>
                  Entrar
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <section className="mt-2">
          <h2 className="mb-3 text-2xl font-bold">Jogos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {GAMES.map((g) => {
              const card = (
              <Card className={cx("flex h-full gap-4", g.status === "soon" ? "opacity-70" : "transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]")}>
                <span className="text-4xl">
                  <Emoji e={g.emoji} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{g.name}</h3>
                    {g.status === "soon" && <Pill className="bg-mustard/25 text-ink">em breve</Pill>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{g.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill>
                      {g.minPlayers === g.maxPlayers ? g.minPlayers : `${g.minPlayers}–${g.maxPlayers}`} pessoas
                    </Pill>
                    <Pill>{g.minutes} min</Pill>
                  </div>
                  {g.status === "available" && <p className="mt-2 text-sm font-bold text-accent">Como jogar →</p>}
                </div>
              </Card>
              );
              return g.status === "available" ? (
                <Link key={g.id} to={`/jogos/${g.id}`} className="block rounded-blob">
                  {card}
                </Link>
              ) : (
                <div key={g.id}>{card}</div>
              );
            })}
          </div>
        </section>

        {/* Rodapé em "pílula" com blur: só em volta dos textos, não ocupa a largura toda. */}
        <footer className="mx-auto mt-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 whitespace-nowrap rounded-full border border-line/60 bg-bg/60 px-4 py-2.5 text-[13px] text-muted shadow-cozy backdrop-blur-xl backdrop-saturate-150 sm:gap-x-3 sm:px-5 sm:text-sm">
          <span>
            Feito com <Emoji e="🧡" label="amor" /> por{" "}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-bold text-ink hover:text-accent">
              @rugalbless
            </a>
          </span>
          <Clover className="size-3.5 text-sage" />
          <a href={COFFEE_URL} target="_blank" rel="noreferrer" className="font-bold text-ink hover:text-accent">
            Me pague um café
          </a>
        </footer>
      </Layout>
    </div>
  );
}
