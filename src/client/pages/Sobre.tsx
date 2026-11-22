import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CoffeeCup } from "../components/CoffeeCup";
import { Emoji } from "../components/Emoji";
import { Layout } from "../components/Layout";
import { BrandCoin } from "../components/BrandMark";
import { Typewriter } from "../components/Typewriter";
import { COFFEE_URL, GITHUB_URL, GITHUB_USER, REPO, REPO_URL } from "../lib/links";
import { usePageMeta } from "../lib/usePageMeta";

/** O combinado, escrito e apagado palavra por palavra no fim da cartinha. */
const DEAL = ["sem cadastro.", "sem anúncio.", "de graça.", "código aberto.", "feito com carinho."];

/** Quantas estrelas o repositório tem (API pública do GitHub, sem login). Some se o repo ainda não existir. */
function useStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${REPO}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (typeof data?.stargazers_count === "number") setStars(data.stargazers_count);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return stars;
}

function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function Sobre() {
  usePageMeta("Sobre · Joguitos");
  const stars = useStars();

  return (
    <Layout>
      <section className="flex animate-fade-up flex-col items-center gap-2 pt-2 text-center">
        <BrandCoin className="size-24" />
        <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Sobre</p>
        <h1 className="max-w-[16ch] text-balance text-4xl font-bold leading-tight">Oi! Que bom te ver por aqui.</h1>
      </section>

      {/* Cartinha */}
      <article className="relative animate-fade-up rounded-blob bg-surface p-6 shadow-cozy ring-1 ring-line [animation-delay:0.1s] sm:p-8">
        <div className="flex flex-col gap-4 text-lg leading-relaxed">
          <p>
            Sabe aquela noite em que a galera se junta, alguém sugere um jogo e metade da roda precisa baixar app, criar conta e esperar
            atualizar? O Joguitos nasceu pra acabar com isso.
          </p>
          <p>
            Aqui é simples: alguém cria a sala, manda o código de 4 letras e todo mundo entra pelo navegador do próprio celular. O
            celular vira o controle, a cartinha secreta e o cronômetro. O resto (a bagunça, as risadas, o{" "}
            <i>"não acredito que você escreveu isso"</i>) acontece na roda, olho no olho.
          </p>
          <p>
            Começou como um projeto de estudo e eu fui me empolgando a cada jogo novo. Não tem anúncio, não tem cadastro e não tem
            pegadinha: é de graça e vai continuar assim.
          </p>
          <p>Teve ideia de jogo, achou um bug ou só quer contar que se divertiu? Me chama no GitHub, vou adorar saber.</p>
        </div>
        {/* Assinatura, alinhada à direita como no fim de uma carta */}
        <div className="mt-6 flex flex-col items-end leading-tight">
          <p className="font-display text-xl font-bold">Bom jogo!</p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-muted hover:text-accent">
            @{GITHUB_USER}
          </a>
        </div>
        <p className="mt-6 min-h-[2.5em] text-center font-display text-2xl font-bold">
          O Joguitos é <Typewriter words={DEAL} className="text-accent" />
        </p>
      </article>

      <div className="grid animate-fade-up gap-3 [animation-delay:0.3s] sm:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-blob bg-ink p-5 text-bg shadow-cozy">
          <GitHubMark className="size-9" />
          <div>
            <h2 className="text-xl font-bold">Curtiu? Deixa uma estrela</h2>
            <p className="mt-1 text-sm opacity-75">Ajuda o projeto a chegar em mais gente (e me deixa feliz demais).</p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-mustard px-4 font-display text-lg font-semibold text-stage transition active:scale-95"
          >
            <Emoji e="⭐" /> Dar uma estrela
            {stars !== null && <span className="rounded-full bg-stage/15 px-2 text-sm tabular-nums">{stars}</span>}
          </a>
        </section>

        <section className="flex flex-col gap-3 rounded-blob bg-mustard/25 p-5 shadow-cozy ring-1 ring-mustard/40">
          <CoffeeCup className="size-14" />
          <div>
            <h2 className="text-xl font-bold">Me paga um café?</h2>
            <p className="mt-1 text-sm text-muted">Se o Joguitos animou sua noite, um cafezinho me ajuda a continuar inventando jogo novo.</p>
          </div>
          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-4 font-display text-lg font-semibold text-accent-ink transition active:scale-95"
          >
            Me pague um café
          </a>
        </section>
      </div>

      <footer className="mt-auto pt-4 text-center text-sm">
        <Link to="/" className="font-bold text-muted hover:text-accent">
          ← Voltar pros jogos
        </Link>
      </footer>
    </Layout>
  );
}
