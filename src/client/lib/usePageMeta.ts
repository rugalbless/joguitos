import { useEffect } from "react";

/**
 * Título da aba e, se `noindex`, pede aos buscadores para não indexar a página (salas são temporárias).
 * Volta ao que era quando a página sai da tela.
 */
export function usePageMeta(title: string, { noindex = false } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = robots?.content;
    if (robots && noindex) robots.content = "noindex, nofollow";
    return () => {
      document.title = prevTitle;
      if (robots && prevRobots) robots.content = prevRobots;
    };
  }, [title, noindex]);
}
