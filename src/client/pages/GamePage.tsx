import { Link, Navigate, useNavigate, useParams } from "react-router";
import { getGame } from "../../shared/games";
import { Emoji } from "../components/Emoji";
import { Layout } from "../components/Layout";
import { Button, Card, Pill } from "../components/ui";
import { GUIDES } from "../games/guides";
import { generateRoomCode } from "../lib/room-code";
import { usePageMeta } from "../lib/usePageMeta";

/** Página de um jogo: o que é, como jogar, dicas e o botão que cria a sala já com ele escolhido. */
export function GamePage() {
  const { id = "" } = useParams();
  const game = getGame(id);
  const guide = GUIDES[id];
  const navigate = useNavigate();
  usePageMeta(guide?.title ?? "Joguitos", { description: guide?.description });
  if (!game || !guide || game.status !== "available") return <Navigate to="/" replace />;

  const play = () => navigate(`/sala/${generateRoomCode()}?jogo=${game.id}`);

  return (
    <Layout>
      <section className="flex flex-col items-center gap-3 rounded-blob bg-accent px-6 py-10 text-center text-accent-ink shadow-cozy">
        <span className="text-6xl">
          <Emoji e={game.emoji} />
        </span>
        <h1 className="text-4xl font-bold">{game.name}</h1>
        <p className="max-w-[40ch] opacity-90">{guide.intro}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <Pill className="bg-accent-ink/20 text-accent-ink">
            {game.minPlayers}–{game.maxPlayers} pessoas
          </Pill>
          <Pill className="bg-accent-ink/20 text-accent-ink">{game.minutes} min</Pill>
        </div>
      </section>

      <Button size="lg" className="w-full text-xl" onClick={play}>
        Jogar agora
      </Button>

      <Card>
        <h2 className="mb-3 text-2xl font-bold">Como jogar</h2>
        <ol className="flex flex-col gap-3">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-accent-ink">
                {i + 1}
              </span>
              <p className="pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-surface-2">
        <h2 className="mb-2 text-xl font-bold">Dicas</h2>
        <ul className="flex flex-col gap-2 text-muted">
          {guide.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-accent">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex flex-col gap-2">
        <Button size="lg" className="w-full text-xl shadow-cozy" onClick={play}>
          Jogar {game.name}
        </Button>
      </div>
      <Link to="/" className="self-center pb-2 text-sm font-bold text-muted hover:text-accent">
        ← Ver todos os jogos
      </Link>
    </Layout>
  );
}
