import type { ReactNode } from "react";
import { Link } from "react-router";
import { Clover } from "./BrandMark";

/**
 * Moldura das páginas. O cabeçalho fica preso no topo com fundo desfocado (o conteúdo passa
 * por trás borrado). À direita, o trevo (marca do autor) leva à página Sobre, onde a marca aparece animada.
 */
export function Layout({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-line/60 bg-bg/65 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl backdrop-saturate-150 sm:rounded-b-blob">
        <Link to="/" className="flex items-center gap-2 transition active:scale-95">
          <img src="/favicon.svg" alt="" className="size-9" />
          <span className="font-display text-2xl font-bold tracking-tight">joguitos</span>
        </Link>
        <div className="flex items-center gap-3">
          {right}
          <Link
            to="/sobre"
            aria-label="Sobre o Joguitos"
            title="Sobre o Joguitos"
            className="grid size-10 place-items-center rounded-full transition hover:bg-surface-2 active:scale-90"
          >
            <Clover className="size-6 text-accent" />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-5">{children}</main>
    </div>
  );
}
