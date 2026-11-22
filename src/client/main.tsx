import { ArtDefs } from "./components/ArtDefs";
import { GridBackdrop } from "./components/GridBackdrop";
import { installAudioUnlock } from "./lib/sound";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, RouterProvider, createBrowserRouter, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { Emoji } from "./components/Emoji";
import { Button } from "./components/ui";
import { Home } from "./pages/Home";
import { GamePage } from "./pages/GamePage";
import { Mural } from "./pages/Mural";
import { MuralAdmin } from "./pages/MuralAdmin";
import { Sobre } from "./pages/Sobre";
import { RoomPage } from "./pages/Room";
import "./index.css";

/**
 * Recarrega a página sozinho, mas no máximo uma vez a cada 20 segundos (se o erro voltar logo em
 * seguida, mostra a tela de erro em vez de ficar recarregando sem parar).
 */
function autoReload() {
  const KEY = "joguitos:auto-reload";
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 20_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sem sessionStorage: recarrega mesmo assim
  }
  location.reload();
  return true;
}

// Caso mais comum: publicamos uma versão nova enquanto a pessoa estava com a antiga aberta, e um
// pedaço do código antigo não existe mais. Recarregar busca a versão nova.
window.addEventListener("vite:preloadError", (event) => {
  if (autoReload()) event.preventDefault();
});

function ErrorPage() {
  const error = useRouteError();
  console.error(error);
  const [reloading] = useState(() => (import.meta.env.DEV ? false : autoReload()));
  if (reloading) return null;
  return (
    <Layout>
      <div className="py-16 text-center">
        <p className="text-6xl">
          <Emoji e="🫠" />
        </p>
        <h1 className="mt-3 text-2xl font-bold">Ih, deu ruim aqui.</h1>
        <p className="mt-2 text-muted">Tenta recarregar a página. Seus pontos ficam salvos na sala.</p>
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="mx-auto mt-4 max-w-md overflow-x-auto rounded-2xl bg-surface-2 p-3 text-left text-xs text-muted">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => location.reload()}>Recarregar</Button>
          <Link to="/" className="inline-flex h-11 items-center px-4 font-bold text-accent">
            Início
          </Link>
        </div>
      </div>
    </Layout>
  );
}

const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/sala/:code", element: <RoomPage /> },
      { path: "/sobre", element: <Sobre /> },
      { path: "/jogos/:id", element: <GamePage /> },
      { path: "/mural", element: <Mural /> },
      { path: "/mural/admin", element: <MuralAdmin /> },
      { path: "/manifesto", element: <Navigate to="/sobre" replace /> },
      {
        path: "*",
        element: (
          <Layout>
            <div className="py-20 text-center">
              <p className="text-6xl">
                <Emoji e="🧦" />
              </p>
              <h1 className="mt-3 text-2xl font-bold">Essa página sumiu que nem meia na máquina.</h1>
              <Link to="/" className="mt-4 inline-block font-bold text-accent">
                Voltar ao início
              </Link>
            </div>
          </Layout>
        ),
      },
    ],
  },
]);

installAudioUnlock();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ArtDefs />
    <GridBackdrop />
    <RouterProvider router={router} />
  </StrictMode>,
);
