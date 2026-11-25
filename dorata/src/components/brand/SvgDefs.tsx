/** Degradados de oro compartidos. Se monta UNA vez en el layout (visible, tamaño 0). */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="dg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3DFA6" />
          <stop offset=".38" stopColor="#C9A050" />
          <stop offset=".62" stopColor="#9A7430" />
          <stop offset="1" stopColor="#E2C47E" />
        </linearGradient>
        <radialGradient id="dg-ball" cx=".35" cy=".32" r=".75">
          <stop offset="0" stopColor="#FFF6DC" />
          <stop offset=".3" stopColor="#E5C77F" />
          <stop offset=".72" stopColor="#B08638" />
          <stop offset="1" stopColor="#6E5020" />
        </radialGradient>
      </defs>
    </svg>
  );
}
