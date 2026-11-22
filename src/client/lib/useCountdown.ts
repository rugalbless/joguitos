import { useEffect, useMemo, useState } from "react";

/**
 * Quanto falta (ms) até `endsAt`, no relógio do servidor. `serverNow` vem junto de cada estado
 * enviado pela sala; com ele, a diferença entre o relógio do celular e o do servidor é corrigida,
 * então todos os celulares mostram o mesmo tempo.
 */
export function useCountdown(endsAt: number | null, serverNow: number | undefined) {
  const offset = useMemo(() => (serverNow ? serverNow - Date.now() : 0), [serverNow]);
  const calc = () => (endsAt ? Math.max(0, endsAt - (Date.now() + offset)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!endsAt) return;
    const id = setInterval(() => setLeft(calc()), 200);
    return () => clearInterval(id);
  }, [endsAt, offset]);
  return left;
}
