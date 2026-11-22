import { routePartykitRequest } from "partyserver";

export { Mural } from "./mural";
export { Room } from "./room";

// Os arquivos estáticos (o site) são servidos direto pelo Cloudflare. Este Worker só recebe:
//   /parties/room/ABCD  ->  Durable Object Room "ABCD" (salas em tempo real)
//   /api/mural/...      ->  Durable Object Mural (fotos da galera)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/mural" || url.pathname.startsWith("/api/mural/")) {
      const stub = env.Mural.get(env.Mural.idFromName("mural"));
      // Repassa o IP só para o limite de envios (o Mural guarda apenas um hash dele).
      const headers = new Headers(request.headers);
      headers.set("x-ip", request.headers.get("cf-connecting-ip") ?? "");
      return stub.fetch(new Request(request, { headers }));
    }
    const response = await routePartykitRequest(request, env);
    return response ?? new Response("Não encontrado", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
