import type { JewelKind } from "@/server/types";

/** Ilustración de respaldo mientras no hay foto real del producto. Decorativa (el alt va en el contenedor). */
export function Jewel({ kind, tint, className }: { kind: JewelKind; tint?: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" className={className} style={{ color: tint ?? "var(--ink)" }}>
      {SHAPES[kind]}
    </svg>
  );
}

const ball = (cx: number, cy: number, r: number) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="url(#dg-ball)" />;

const SHAPES: Record<JewelKind, React.ReactNode> = {
  chain: (
    <>
      <path d="M30 20 C30 120 70 170 100 170 C130 170 170 120 170 20" fill="none" stroke="url(#dg-gold)" strokeWidth="7" strokeDasharray="7 3.5" strokeLinecap="round" />
      <path d="M30 20 C30 120 70 170 100 170 C130 170 170 120 170 20" fill="none" stroke="#FFF3CF" strokeOpacity=".55" strokeWidth="2" strokeDasharray="3 7.5" strokeLinecap="round" />
      {ball(100, 174, 7)}
    </>
  ),
  hoops: (
    <>
      <circle cx="70" cy="110" r="40" fill="none" stroke="url(#dg-gold)" strokeWidth="11" />
      <circle cx="136" cy="96" r="40" fill="none" stroke="url(#dg-gold)" strokeWidth="11" />
      <path d="M58 76 a40 40 0 0 1 30 -4" stroke="#FFF3CF" strokeOpacity=".7" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M124 62 a40 40 0 0 1 30 -4" stroke="#FFF3CF" strokeOpacity=".7" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  studs: (
    <>
      {ball(72, 104, 30)}
      {ball(136, 96, 30)}
      <circle cx="62" cy="94" r="7" fill="#FFF9E8" opacity=".8" />
      <circle cx="126" cy="86" r="7" fill="#FFF9E8" opacity=".8" />
    </>
  ),
  clover: (
    <>
      <path d="M100 10 V64" stroke="url(#dg-gold)" strokeWidth="4" strokeDasharray="5 3" />
      <g fill="url(#dg-gold)" stroke="#8E6A2C" strokeWidth="1">
        <circle cx="100" cy="88" r="24" /><circle cx="76" cy="112" r="24" /><circle cx="124" cy="112" r="24" /><circle cx="100" cy="136" r="24" />
      </g>
      <g fill="none" stroke="#FFF3CF" strokeOpacity=".6" strokeWidth="2">
        <circle cx="100" cy="88" r="14" /><circle cx="76" cy="112" r="14" /><circle cx="124" cy="112" r="14" /><circle cx="100" cy="136" r="14" />
      </g>
      {ball(100, 112, 7)}
    </>
  ),
  beads: (
    <>
      {[[100, 40], [135, 50], [158, 78], [164, 112], [148, 143], [120, 162], [86, 164], [56, 150], [38, 122], [36, 88], [54, 58]].map(([x, y]) => ball(x!, y!, 13))}
      {ball(72, 44, 10)}
    </>
  ),
  thread: (
    <>
      <ellipse cx="100" cy="104" rx="72" ry="50" fill="none" stroke="currentColor" strokeWidth="4" />
      {ball(100, 154, 11)}{ball(76, 150, 8)}{ball(124, 150, 8)}{ball(56, 141, 6.5)}{ball(144, 141, 6.5)}
      <path d="M160 70 l14 -12 M164 76 l16 -6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  set: (
    <>
      <path d="M40 20 C40 100 75 132 100 132 C125 132 160 100 160 20" fill="none" stroke="url(#dg-gold)" strokeWidth="5" strokeDasharray="6 3" strokeLinecap="round" />
      <g fill="url(#dg-gold)"><circle cx="100" cy="146" r="12" /><circle cx="88" cy="158" r="12" /><circle cx="112" cy="158" r="12" /><circle cx="100" cy="170" r="12" /></g>
      {ball(40, 168, 11)}{ball(160, 168, 11)}
    </>
  ),
  medal: (
    <>
      <path d="M100 10 V56" stroke="url(#dg-gold)" strokeWidth="4" strokeDasharray="5 3" />
      <circle cx="100" cy="62" r="7" fill="none" stroke="url(#dg-gold)" strokeWidth="4" />
      <circle cx="100" cy="118" r="50" fill="url(#dg-gold)" stroke="#8E6A2C" strokeWidth="1.5" />
      <circle cx="100" cy="118" r="40" fill="none" stroke="#FFF3CF" strokeOpacity=".6" strokeWidth="2" />
      <path d="M100 92 V144 M84 108 H116" stroke="#8E6A2C" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  links: (
    <>
      <ellipse cx="100" cy="104" rx="74" ry="52" fill="none" stroke="url(#dg-gold)" strokeWidth="12" strokeDasharray="22 6" />
      <ellipse cx="100" cy="104" rx="74" ry="52" fill="none" stroke="#FFF3CF" strokeOpacity=".5" strokeWidth="2.5" strokeDasharray="10 18" />
    </>
  ),
};
