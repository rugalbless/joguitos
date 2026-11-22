// Chamadas à API do mural e preparo da foto no celular.
import { MURAL_LIMITS, type MuralAdminPhoto, type MuralPhoto, type MuralUpload } from "../../shared/mural";

/** Id fixo deste celular (o mesmo do perfil), usado só para lembrar das curtidas. */
function myId() {
  try {
    return (JSON.parse(localStorage.getItem("joguitos:profile") ?? "{}") as { id?: string }).id ?? "";
  } catch {
    return "";
  }
}

async function call<T>(path: string, init: RequestInit = {}, adminKey?: string): Promise<T> {
  const res = await fetch(`/api/mural${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-joguitos-id": myId(),
      ...(adminKey ? { "x-admin-key": adminKey } : {}),
      ...init.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Não deu certo. Tenta de novo?");
  return data;
}

export const muralApi = {
  list: (before?: number) => call<{ photos: MuralPhoto[] }>(before ? `?antes=${before}` : ""),
  upload: (body: MuralUpload) => call<{ ok: true; id: string }>("", { method: "POST", body: JSON.stringify(body) }),
  like: (id: string) => call<{ liked: boolean; likes: number }>(`/${id}/curtir`, { method: "POST" }),
  report: (id: string) => call<{ ok: true }>(`/${id}/remover`, { method: "POST" }),
  admin: (key: string) => call<{ photos: MuralAdminPhoto[] }>("/admin", {}, key),
  approve: (id: string, key: string) => call<{ ok: true }>(`/${id}/aprovar`, { method: "POST" }, key),
  reject: (id: string, key: string) => call<{ ok: true }>(`/${id}/rejeitar`, { method: "POST" }, key),
};

export const photoUrl = (id: string, adminKey?: string) => `/api/mural/${id}/foto${adminKey ? `?k=${encodeURIComponent(adminKey)}` : ""}`;

/**
 * Prepara a foto para o mural: reduz (lado maior até 1080px) e recodifica em WebP/JPEG.
 * Redesenhar no canvas também apaga os dados escondidos da foto, como a localização GPS.
 */
export async function preparePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  for (const [side, quality] of [
    [1080, 0.82],
    [960, 0.72],
    [800, 0.65],
  ] as const) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let data = canvas.toDataURL("image/webp", quality);
    // Navegadores que não geram WebP devolvem PNG: usa JPEG.
    if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= MURAL_LIMITS.maxImageChars) return data;
  }
  throw new Error("Foto grande demais.");
}
