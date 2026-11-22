import type { AnswerStatus } from "../../../shared/games/adedonha";

export const STATUS_LABEL: Record<AnswerStatus, { text: string; className: string }> = {
  unique: { text: "+10", className: "bg-sage/30 text-ink" },
  repeated: { text: "+5 repetida", className: "bg-mustard/30 text-ink" },
  empty: { text: "em branco", className: "bg-surface-2 text-muted" },
  "wrong-letter": { text: "letra errada", className: "bg-plum/20 text-plum" },
  rejected: { text: "anulada", className: "bg-plum/20 text-plum" },
};
