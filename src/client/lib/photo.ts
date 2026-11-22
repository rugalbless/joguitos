import { LIMITS } from "../../shared/protocol";

/**
 * Transforma a foto escolhida (câmera ou galeria) num avatar pequeno: recorte quadrado
 * no centro, 128px, JPEG. Fica com ~6–10 KB, leve o bastante para ir junto do estado da sala.
 */
export async function photoToAvatar(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    for (const [size, quality] of [[128, 0.82], [96, 0.75], [72, 0.7]] as const) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= LIMITS.maxAvatarLength) return data;
    }
    throw new Error("Foto muito pesada");
  } finally {
    URL.revokeObjectURL(url);
  }
}
