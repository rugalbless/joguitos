import type { CSSProperties, ReactNode } from "react";
import { cx } from "./ui";

// Ícones das redes para os botões de compartilhar o ranking: cada um num círculo com a cor da marca
// (cores de marca, não do tema do site). Desenhos simplificados, em SVG.

function Badge({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className={cx("grid size-9 place-items-center rounded-full text-white ring-2 ring-surface-2", className)} style={style} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5">
        {children}
      </svg>
    </span>
  );
}

export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <Badge className={className} style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)" }}>
      <rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
    </Badge>
  );
}

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <Badge className={className} style={{ background: "#25d366" }}>
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41Z"
      />
    </Badge>
  );
}

export function XIcon({ className = "" }: { className?: string }) {
  return (
    <Badge className={className} style={{ background: "#000" }}>
      <path
        fill="currentColor"
        d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z"
      />
    </Badge>
  );
}
