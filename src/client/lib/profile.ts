// Perfil local do jogador (id fixo + nome + avatar), salvo no próprio celular.
// O id fixo é o que permite reconectar na sala sem perder os pontos.
import { useCallback, useState } from "react";
import { MASCOTS, isMascot } from "../../shared/mascots";

export const AVATARS = MASCOTS;

export type Profile = {
  id: string;
  name: string;
  /** Mascote em uso: um id de AVATARS ou a foto (data URL). */
  avatar: string;
  /** Última foto escolhida, guardada para poder voltar a ela depois de testar outro mascote. */
  photo?: string;
};

const KEY = "joguitos:profile";

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>;
      if (p.id) return { id: p.id, name: p.name ?? "", avatar: validAvatar(p.avatar) ? p.avatar : randomAvatar(), photo: p.photo };
    }
  } catch {
    // navegador anônimo / storage bloqueado: segue com perfil temporário
  }
  return { id: newId(), name: "", avatar: randomAvatar() };
}

/**
 * `crypto.randomUUID` só existe em HTTPS/localhost. Acessando o dev server pelo IP da rede
 * (http://192.168…) ele é undefined; `getRandomValues` funciona em qualquer contexto.
 */
function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

// Perfis antigos guardavam um emoji: esses ganham um mascote novo.
function validAvatar(a: string | undefined): a is string {
  return !!a && (isMascot(a) || a.startsWith("data:image/"));
}

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(() => {
    const p = load();
    save(p);
    return p;
  });

  const update = useCallback((patch: Partial<Omit<Profile, "id">>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return [profile, update] as const;
}
