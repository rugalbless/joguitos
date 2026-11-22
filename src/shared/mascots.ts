// Mascotes oficiais do site. As imagens ficam em public/mascotes/NN.webp
// (recortes quadrados de 256px gerados a partir da pasta mascotes/ da raiz).

export const MASCOTS = Array.from({ length: 16 }, (_, i) => `m${String(i + 1).padStart(2, "0")}`);

export const isMascot = (avatar: string) => MASCOTS.includes(avatar);

export const mascotUrl = (id: string) => `/mascotes/${id.slice(1)}.webp`;
