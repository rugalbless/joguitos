import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/**
 * Endereço público do site, sem barra no final (ex.: "https://joguitos.seu-usuario.workers.dev").
 * Preencha depois do primeiro deploy: WhatsApp, Facebook e Google precisam do endereço completo
 * para a imagem de prévia e o link canônico. Vazio, os links ficam relativos (funciona, mas a
 * prévia em redes sociais pode não aparecer).
 */
const SITE_URL = process.env.SITE_URL ?? "https://joguitos.joguitos.workers.dev";

/** Troca %SITE_URL% no index.html e só inclui o link canônico quando o endereço existe. */
function siteUrl(): Plugin {
  return {
    name: "joguitos-site-url",
    transformIndexHtml(html) {
      const out = html.replaceAll("%SITE_URL%", SITE_URL);
      return SITE_URL ? out : out.replace(/^\s*<link rel="canonical"[^>]*>\n|^\s*<meta property="og:url"[^>]*>\n/gm, "");
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare(), siteUrl()],
  // host: true expõe o dev server na rede local, pra testar nos celulares da galera no mesmo Wi-Fi.
  server: { host: true },
});
