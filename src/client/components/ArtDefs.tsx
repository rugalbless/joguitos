import { ART_DEFS } from "../icons/art";

/**
 * Definições SVG compartilhadas pelos desenhos de src/client/icons/art.ts, renderizadas uma vez na raiz:
 * - `#art-3d`: sombra suave no "chão", embaixo do desenho;
 * - `#art-hl` e outros degradês de ART_DEFS.
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="art-3d" x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="blur" />
          <feOffset in="blur" dy="3" result="offset" />
          <feFlood floodColor="#2a1a12" floodOpacity="0.28" />
          <feComposite in2="offset" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <defs dangerouslySetInnerHTML={{ __html: ART_DEFS }} />
    </svg>
  );
}
