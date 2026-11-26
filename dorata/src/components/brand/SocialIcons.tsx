/** Íconos de redes (trazo 1.5, mismo lenguaje que Lucide). Decorativos: el nombre va en aria-label del enlace. */
type P = { size?: number; strokeWidth?: number; className?: string };
const base = (size: number, sw: number, className?: string) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, className,
});

export function InstagramIcon({ size = 20, strokeWidth = 1.5, className }: P) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export function TikTokIcon({ size = 20, strokeWidth = 1.5, className }: P) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, strokeWidth = 1.5, className }: P) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M16 3h-2.5A4.5 4.5 0 0 0 9 7.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7.5a1 1 0 0 1 1-1H16z" />
    </svg>
  );
}
