import { ART } from "../icons/art";

/**
 * Desenho próprio do Joguitos (SVG em src/client/icons/art.ts), chamado pelo emoji equivalente.
 * O tamanho acompanha a fonte do elemento pai (1.2em), então `text-5xl` no pai deixa o desenho grande.
 * Se ainda não existir desenho para esse emoji, mostra o emoji do sistema (`native` cala o aviso:
 * use quando o emoji vem de dados, como as palavras da Mímica).
 */
export function Emoji({ e, label, className = "", native = false }: { e: string; label?: string; className?: string; native?: boolean }) {
  const art = ART[e];
  if (!art) {
    if (import.meta.env.DEV && !native) console.warn(`Sem desenho para o emoji ${e} em src/client/icons/art.ts`);
    return (
      <span className={className} role="img" aria-label={label} aria-hidden={label ? undefined : true}>
        {e}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`art inline-block size-[1.2em] shrink-0 select-none overflow-visible align-[-0.25em] ${className}`}
      // conteúdo estático, escrito por nós em art.ts. O filtro 3D vem de ArtDefs.
      dangerouslySetInnerHTML={{ __html: `<g filter="url(#art-3d)">${art}</g>` }}
    />
  );
}
