import { ArtDefs } from "./components/ArtDefs";
import { GridBackdrop } from "./components/GridBackdrop";
import { installAudioUnlock } from "./lib/sound";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, RouterProvider, createBrowserRouter, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { Emoji } from "./components/Emoji";
import { Button } from "./components/ui";
import { Home } from "./pages/Home";
import { Sobre } from "./pages/Sobre";
import { RoomPage } from "./pages/Room";
import "./index.css";

function ErrorPage() {
  const error = useRouteError();
  console.error(error);
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
