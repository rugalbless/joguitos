import { DurableObject } from "cloudflare:workers";
import {
  MURAL_LIMITS as L,
  type MuralAdminPhoto,
  type MuralPhoto,
  type MuralStatus,
  type MuralUpload,
  OCASIOES,
  type UF,
  isUF,
} from "../shared/mural";
import { GAMES } from "../shared/games";

// Mural da galera: um único Durable Object (SQLite, plano gratuito) com as fotos e curtidas.
// A foto aparece na hora; o autor do site (MURAL_ADMIN_KEY) apaga depois o que não for de bom senso.
// "Pedir para tirar" esconde a foto até o autor revisar. Não guarda IP: só um hash, para limitar envios por hora.

type Row = Record<string, SqlStorageValue>;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const err = (message: string, status = 400) => json({ error: message }, status);

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export class Mural extends DurableObject<Env> {
  private sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY, created INTEGER NOT NULL, status TEXT NOT NULL,
        city TEXT NOT NULL, uf TEXT NOT NULL, occasion TEXT NOT NULL, caption TEXT NOT NULL,
        game TEXT, image TEXT, likes INTEGER NOT NULL DEFAULT 0, reports INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS photos_status ON photos (status, created);
      CREATE TABLE IF NOT EXISTS likes (photo TEXT NOT NULL, voter TEXT NOT NULL, PRIMARY KEY (photo, voter));
      CREATE TABLE IF NOT EXISTS uploads (who TEXT NOT NULL, at INTEGER NOT NULL);
    `);
  }

  private isAdmin(req: Request) {
    const key = this.env.MURAL_ADMIN_KEY;
    return !!key && req.headers.get("x-admin-key") === key;
  }

  private toPhoto(r: Row, voter: string | null): MuralPhoto {
    const liked = voter
      ? this.sql.exec("SELECT 1 FROM likes WHERE photo = ? AND voter = ?", r.id, voter).toArray().length > 0
      : false;
    return {
      id: String(r.id),
      city: String(r.city),
      uf: r.uf as UF,
      occasion: String(r.occasion),
      caption: String(r.caption),
      game: (r.game as string | null) ?? null,
      createdAt: Number(r.created),
      likes: Number(r.likes),
      liked,
    };
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/api\/mural\/?/, "").split("/").filter(Boolean);
    const voter = clean(req.headers.get("x-joguitos-id"), 64) || null;

    // GET /api/mural  → fotos aprovadas, mais novas primeiro (paginado com ?antes=)
    if (req.method === "GET" && parts.length === 0) {
      const before = Number(url.searchParams.get("antes")) || Date.now() + 1;
      const rows = this.sql
        .exec("SELECT * FROM photos WHERE status = 'approved' AND created < ? ORDER BY created DESC LIMIT ?", before, L.pageSize)
        .toArray();
      return json({ photos: rows.map((r) => this.toPhoto(r, voter)) });
    }

    // GET /api/mural/admin  → pedidos para tirar e as fotos dos últimos 30 dias
    if (req.method === "GET" && parts[0] === "admin") {
      if (!this.isAdmin(req)) return err("Senha errada.", 401);
      const rows = this.sql
        .exec("SELECT * FROM photos WHERE status IN ('pending','reported') OR (status = 'approved' AND created > ?) ORDER BY created DESC LIMIT 200", Date.now() - 30 * 864e5)
        .toArray();
      const photos: MuralAdminPhoto[] = rows.map((r) => ({ ...this.toPhoto(r, null), status: r.status as MuralStatus, reports: Number(r.reports) }));
      return json({ photos });
    }

    // GET /api/mural/:id/foto  → a imagem (aprovada, ou qualquer uma para o admin)
    if (req.method === "GET" && parts[1] === "foto") {
      const r = this.sql.exec("SELECT image, status FROM photos WHERE id = ?", parts[0]).toArray()[0];
      const admin = url.searchParams.get("k") === this.env.MURAL_ADMIN_KEY && !!this.env.MURAL_ADMIN_KEY;
      if (!r || !r.image || (r.status !== "approved" && !admin)) return new Response("Não encontrada", { status: 404 });
      const [head, b64] = String(r.image).split(",");
      const type = head.slice(5, head.indexOf(";"));
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return new Response(bytes, {
        headers: { "content-type": type, "cache-control": admin ? "no-store" : "public, max-age=86400" },
      });
    }

    // POST /api/mural  → envia uma foto (aparece no mural na hora)
    if (req.method === "POST" && parts.length === 0) {
      let body: MuralUpload;
      try {
        body = await req.json();
      } catch {
        return err("Envio inválido.");
      }
      if (!body.consentPeople || !body.consentMinors) return err("Marque as caixas de consentimento.");
      const image = typeof body.image === "string" ? body.image : "";
      if (!/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > L.maxImageChars)
        return err("Essa foto não deu certo. Tenta outra?");
      const city = clean(body.city, L.maxCity);
      if (!city) return err("Diga a cidade.");
      if (!isUF(body.uf)) return err("Escolha o estado.");
      const occasion = (OCASIOES as readonly string[]).includes(body.occasion) ? body.occasion : "Outra ocasião";
      const game = GAMES.find((g) => g.id === body.game)?.name ?? null;

      // Limite por hora, por pessoa (hash do IP, nunca o IP em si).
      const who = await sha256(`${req.headers.get("x-ip") ?? "?"}|joguitos-mural`);
      const hourAgo = Date.now() - 3600_000;
      this.sql.exec("DELETE FROM uploads WHERE at < ?", hourAgo);
      const recent = this.sql.exec("SELECT COUNT(*) AS n FROM uploads WHERE who = ?", who).toArray()[0];
      if (Number(recent?.n ?? 0) >= L.uploadsPerHour) return err("Muitas fotos em pouco tempo. Tenta de novo mais tarde.", 429);
      this.sql.exec("INSERT INTO uploads (who, at) VALUES (?, ?)", who, Date.now());

      const id = crypto.randomUUID().slice(0, 12);
      this.sql.exec(
        "INSERT INTO photos (id, created, status, city, uf, occasion, caption, game, image) VALUES (?, ?, 'approved', ?, ?, ?, ?, ?, ?)",
        id,
        Date.now(),
        city,
        body.uf,
        occasion,
        clean(body.caption, L.maxCaption),
        game,
        image,
      );
      return json({ ok: true, id });
    }

    // POST /api/mural/:id/curtir  → curte / descurte
    if (req.method === "POST" && parts[1] === "curtir") {
      if (!voter) return err("Sem identificação.");
      const r = this.sql.exec("SELECT status FROM photos WHERE id = ?", parts[0]).toArray()[0];
      if (!r || r.status !== "approved") return err("Foto não encontrada.", 404);
      const had = this.sql.exec("SELECT 1 FROM likes WHERE photo = ? AND voter = ?", parts[0], voter).toArray().length > 0;
      if (had) this.sql.exec("DELETE FROM likes WHERE photo = ? AND voter = ?", parts[0], voter);
      else this.sql.exec("INSERT INTO likes (photo, voter) VALUES (?, ?)", parts[0], voter);
      this.sql.exec("UPDATE photos SET likes = (SELECT COUNT(*) FROM likes WHERE photo = ?) WHERE id = ?", parts[0], parts[0]);
      const likes = Number(this.sql.exec("SELECT likes FROM photos WHERE id = ?", parts[0]).toArray()[0]?.likes ?? 0);
      return json({ liked: !had, likes });
    }

    // POST /api/mural/:id/remover  → "aparece você? pedir para tirar": some na hora até o admin revisar
    if (req.method === "POST" && parts[1] === "remover") {
      this.sql.exec("UPDATE photos SET status = 'reported', reports = reports + 1 WHERE id = ? AND status = 'approved'", parts[0]);
      return json({ ok: true });
    }

    // POST /api/mural/:id/(aprovar|rejeitar)  → só o admin: devolve ao mural ou apaga de vez
    if (req.method === "POST" && (parts[1] === "aprovar" || parts[1] === "rejeitar")) {
      if (!this.isAdmin(req)) return err("Senha errada.", 401);
      if (parts[1] === "aprovar") this.sql.exec("UPDATE photos SET status = 'approved', reports = 0 WHERE id = ?", parts[0]);
      else {
        // Rejeitada: apaga a imagem de vez (fica só o registro, sem foto).
        this.sql.exec("UPDATE photos SET status = 'rejected', image = NULL WHERE id = ?", parts[0]);
        this.sql.exec("DELETE FROM likes WHERE photo = ?", parts[0]);
      }
      return json({ ok: true });
    }

    return err("Não encontrado.", 404);
  }
}
