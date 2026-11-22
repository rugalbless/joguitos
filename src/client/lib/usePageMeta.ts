import { useEffect } from "react";

/**
 * Título da aba, descrição para o Google (opcional) e, se `noindex`, pede aos buscadores para não
 * indexar a página (salas são temporárias). Volta ao que era quando a página sai da tela.
 */
export function usePageMeta(title: string, { noindex = false, description }: { noindex?: boolean; description?: string } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = robots?.content;
    if (robots && noindex) robots.content = "noindex, nofollow";
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = desc?.content;
    if (desc && description) desc.content = description;
    return () => {
      document.title = prevTitle;
      if (robots && prevRobots) robots.content = prevRobots;
      if (desc && prevDesc) desc.content = prevDesc;
    };
  }, [title, noindex, description]);
}
