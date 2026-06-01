/**
 * HorecaHub.az SVG Logo
 * light=false → tünd (cream/ağ fon üçün)
 * light=true  → ağ  (tünd fon üçün: hero, footer)
 */
export default function Logo({ light = false, height = 38 }) {
  const ink   = light ? '#FFFFFF' : '#0D1B2A'
  const scale = height / 44

  return (
    <svg
      width={Math.round(220 * scale)}
      height={height}
      viewBox="0 0 220 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HorecaHub.az"
    >
      {/* ── H ─────────────────────────────────────── */}
      <text
        x="0" y="33"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="700"
        fontSize="30"
        fill={ink}
        letterSpacing="-0.5"
      >H</text>

      {/* ── O  with fork + knife icon ─────────────── */}
      {/* Circle "O" */}
      <circle cx="46" cy="18" r="14" stroke={ink} strokeWidth="2.6" fill="none"/>
      {/* Fork (left) */}
      <line x1="41" y1="10" x2="41" y2="25" stroke={ink} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="39" y1="10" x2="39" y2="15" stroke={ink} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="41" y1="10" x2="41" y2="15" stroke={ink} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="43" y1="10" x2="43" y2="15" stroke={ink} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="39" y1="15" x2="43" y2="15" stroke={ink} strokeWidth="1.4" strokeLinecap="round"/>
      {/* Knife (right) */}
      <line x1="51" y1="10" x2="51" y2="25" stroke={ink} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M51 10 Q55 13 51 17" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round"/>

      {/* ── RECA ─────────────────────────────────── */}
      <text
        x="63" y="33"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="700"
        fontSize="30"
        fill={ink}
        letterSpacing="-0.5"
      >RECA</text>

      {/* ── HUB badge ────────────────────────────── */}
      <rect x="148" y="2" width="72" height="38" rx="8" fill="#1D4ED8"/>

      {/* HUB text */}
      <text
        x="155" y="29"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="700"
        fontSize="24"
        fill="#FFFFFF"
        letterSpacing="0"
      >HUB</text>

      {/* Network dots icon (top-right of badge) */}
      <circle cx="211" cy="7"  r="3"   fill="white" opacity="0.9"/>
      <circle cx="205" cy="13" r="2"   fill="white" opacity="0.7"/>
      <circle cx="211" cy="14" r="1.5" fill="white" opacity="0.6"/>
      <line x1="211" y1="7" x2="205" y2="13" stroke="white" strokeWidth="1" opacity="0.5"/>
      <line x1="205" y1="13" x2="211" y2="14" stroke="white" strokeWidth="1" opacity="0.5"/>
      <line x1="211" y1="7"  x2="211" y2="14" stroke="white" strokeWidth="1" opacity="0.5"/>
    </svg>
  )
}
