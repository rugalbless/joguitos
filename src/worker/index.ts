import { routePartykitRequest } from "partyserver";

export { Room } from "./room";

// Os arquivos estáticos (o site) são servidos direto pelo Cloudflare.
// Este Worker só recebe /parties/* e encaminha cada sala para o seu Durable Object:
//   /parties/room/ABCD  ->  Room "ABCD"
export default {
  async fetch(request, env) {
    const response = await routePartykitRequest(request, env);
    return response ?? new Response("Não encontrado", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
