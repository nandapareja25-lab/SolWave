/**
 * Logo PROVISIONAL (corona + D'ORATA + ORO LAMINADO 18K). Cuando la dueña sube su archivo
 * oficial en Configuración, `logoUrl` lo reemplaza sin tocar código.
 */
type Props = { logoUrl?: string | null; tone?: "dark" | "light"; size?: "sm" | "md" | "lg"; className?: string };

const SIZES = { sm: { w: 128, h: 48 }, md: { w: 150, h: 56 }, lg: { w: 240, h: 90 } } as const;

export function Logo({ logoUrl, tone = "light", size = "md", className }: Props) {
  const { w, h } = SIZES[size];
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- archivo de marca ya optimizado (SVG/WebP)
    return <img src={logoUrl} alt="D'ORATA · Oro laminado 18K" width={w} height={h} className={className} />;
  }
  const descriptorFill = tone === "dark" ? "var(--gold)" : "var(--gold-deep)";
  return (
    <svg width={w} height={h} viewBox="0 0 150 56" role="img" aria-label="D'ORATA · Oro laminado 18K" className={className}>
      <g transform="translate(57 0) scale(.3)">
        <path d="M14 46 L8 14 L34 32 L60 6 L86 32 L112 14 L106 46 Z" fill="none" stroke="url(#dg-gold)" strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M16 52 H104" stroke="url(#dg-gold)" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="8" cy="12" r="4.5" fill="url(#dg-ball)" />
        <circle cx="60" cy="5" r="5" fill="url(#dg-ball)" />
        <circle cx="112" cy="12" r="4.5" fill="url(#dg-ball)" />
      </g>
      <text x="75" y="39" textAnchor="middle" fill="url(#dg-gold)" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: 3 }}>
        D’ORATA
      </text>
      <text x="75" y="52" textAnchor="middle" fill={descriptorFill} style={{ fontFamily: "var(--font-sans)", fontSize: 6.6, fontWeight: 600, letterSpacing: 2.4 }}>
        ORO LAMINADO 18K
      </text>
    </svg>
  );
}
