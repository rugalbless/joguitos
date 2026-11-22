import { type FormEvent, useEffect, useState } from "react";
import type { MuralAdminPhoto } from "../../shared/mural";
import { Layout } from "../components/Layout";
import { Button, Card, Pill } from "../components/ui";
import { muralApi, photoUrl } from "../lib/mural";
import { usePageMeta } from "../lib/usePageMeta";

const KEY = "joguitos:mural-admin";
const STATUS: Record<string, string> = { pending: "fora do mural", reported: "pediram para tirar", approved: "no mural", rejected: "apagada" };

/** Página só do autor: apaga fotos do mural (ou devolve as que pediram para tirar). A senha fica só nesta aba. */
export function MuralAdmin() {
  usePageMeta("Cuidar do mural · Joguitos", { noindex: true });
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY) ?? "");
  const [typed, setTyped] = useState("");
  const [photos, setPhotos] = useState<MuralAdminPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(k = key) {
    try {
      const r = await muralApi.admin(k);
      setPhotos(r.photos);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setKey("");
      sessionStorage.removeItem(KEY);
    }
  }

  useEffect(() => {
    if (key) void load(key);
    // carrega uma vez quando a senha muda
  }, [key]);

  function login(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(KEY, typed);
    setKey(typed);
  }

  async function act(id: string, approve: boolean) {
    await (approve ? muralApi.approve(id, key) : muralApi.reject(id, key));
    await load();
  }

  if (!key) {
    return (
      <Layout>
        <Card>
          <form onSubmit={login} className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">Cuidar do mural</h1>
            <input type="password" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Senha" className="h-12 rounded-2xl border-2 border-line bg-bg px-3 font-bold outline-none focus:border-accent" />
            {error && <p className="text-sm font-bold text-accent">{error}</p>}
            <Button type="submit">Entrar</Button>
          </form>
        </Card>
      </Layout>
    );
  }

  const queue = photos?.filter((p) => p.status === "pending" || p.status === "reported") ?? [];
  const recent = photos?.filter((p) => p.status === "approved") ?? [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Cuidar do mural</h1>
      <p className="text-muted">
        {queue.length === 0 ? "Ninguém pediu para tirar foto." : `${queue.length} ${queue.length === 1 ? "pedido" : "pedidos"} para tirar foto (já estão fora do mural).`} Abaixo, as fotos dos últimos 30 dias.
      </p>
      {[...queue, ...recent].map((p) => (
        <Card key={p.id} className="flex flex-col gap-3">
          <img src={photoUrl(p.id, key)} alt="" className="max-h-96 w-full rounded-2xl bg-surface-2 object-contain" />
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={p.status === "reported" ? "bg-accent text-accent-ink" : ""}>{STATUS[p.status]}</Pill>
            <span className="font-bold">
              {p.occasion} · {p.city}, {p.uf}
            </span>
            {p.game && <span className="text-sm text-muted">{p.game}</span>}
          </div>
          {p.caption && <p>{p.caption}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" className="bg-accent text-accent-ink" onClick={() => confirm("Apagar essa foto de vez?") && act(p.id, false)}>
              Apagar
            </Button>
            {p.status !== "approved" && (
              <Button variant="soft" onClick={() => act(p.id, true)}>
                Devolver ao mural
              </Button>
            )}
          </div>
        </Card>
      ))}
    </Layout>
  );
}
