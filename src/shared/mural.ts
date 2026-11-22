// Mural da galera: fotos das jogatinas, publicadas só depois de aprovadas pelo autor do site.
// Tipos e regras compartilhados entre o celular e o servidor.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type UF = (typeof UFS)[number];

export const OCASIOES = [
  "Aniversário",
  "Churrasco",
  "Fim de semana",
  "Natal / Ano-novo",
  "Viagem",
  "Escola / Facul",
  "Trabalho",
  "Festa",
  "Outra ocasião",
] as const;

export const MURAL_LIMITS = {
  maxCity: 40,
  maxCaption: 80,
  /** Tamanho máximo da foto já reduzida no celular (data URL). */
  maxImageChars: 450_000,
  /** Fotos por pessoa (IP) por hora. */
  uploadsPerHour: 4,
  pageSize: 24,
} as const;

export type MuralStatus = "pending" | "approved" | "reported" | "rejected";

/** Foto como aparece no mural (sem a imagem em si: ela vem de /api/mural/:id/foto). */
export type MuralPhoto = {
  id: string;
  city: string;
  uf: UF;
  occasion: string;
  caption: string;
  game: string | null;
  createdAt: number;
  likes: number;
  /** Este celular já curtiu? */
  liked: boolean;
};

export type MuralAdminPhoto = MuralPhoto & { status: MuralStatus; reports: number };

export type MuralUpload = {
  image: string;
  city: string;
  uf: string;
  occasion: string;
  caption?: string;
  game?: string | null;
  /** Caixas de consentimento marcadas. */
  consentPeople: boolean;
  consentMinors: boolean;
};

export const isUF = (v: unknown): v is UF => typeof v === "string" && (UFS as readonly string[]).includes(v);
