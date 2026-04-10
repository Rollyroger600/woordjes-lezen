// ============================================================
// Salamander.jsx — Sami de Salamander
// Puur inline SVG, geen externe assets.
// States: idle | happy | proud | thinking | sad | celebrating | excited
// Sizes: sm (80px) | md (110px) | lg (140px)
// ============================================================

const SIZES = { sm: 80, md: 110, lg: 140 }

export default function Salamander({ state = 'idle', size = 'md', className = '' }) {
  const px = SIZES[size] ?? SIZES.md

  // Animatieklasse op basis van state
  const animClass = {
    idle:        'sami-idle',
    happy:       'sami-happy',
    proud:       'sami-proud',
    thinking:    'sami-thinking',
    sad:         'sami-sad',
    celebrating: 'sami-celebrating',
    excited:     'sami-excited',
  }[state] ?? 'sami-idle'

  // Mond-vorm op basis van state
  const mouthPath = {
    idle:        'M 38 62 Q 50 70 62 62',  // kleine lach
    happy:       'M 34 62 Q 50 76 66 62',  // grote lach
    proud:       'M 36 62 Q 50 72 64 62',  // trotse lach
    thinking:    'M 40 65 Q 50 68 60 65',  // neutrale mond
    sad:         'M 36 68 Q 50 58 64 68',  // droeve mond
    celebrating: 'M 33 60 Q 50 78 67 60',  // heel grote lach
    excited:     'M 33 61 Q 50 77 67 61',  // enthousiaste lach
  }[state] ?? 'M 38 62 Q 50 70 62 62'

  // Ooggrootte (pupils)
  const pupilR = state === 'excited' ? 7 : state === 'happy' || state === 'celebrating' ? 6 : 5

  // Wenkbrauw hoek (droef = omhoog binnenste, blij = omhoog buitenste)
  const leftBrow = state === 'sad'
    ? 'M 30 34 Q 40 38 44 36'
    : state === 'thinking'
    ? 'M 30 33 Q 40 30 44 32'
    : 'M 30 33 Q 40 30 44 33'

  const rightBrow = state === 'sad'
    ? 'M 56 36 Q 60 38 70 34'
    : state === 'thinking'
    ? 'M 56 32 Q 60 30 70 33'
    : 'M 56 33 Q 60 30 70 33'

  return (
    <div
      className={`sami-wrapper ${animClass} ${className}`}
      style={{ width: px, height: px, display: 'inline-block' }}
      role="img"
      aria-label="Sami de Salamander"
    >
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ---- Staart (achter het lichaam) ---- */}
        <path
          d="M 25 65 Q 5 75 8 90 Q 12 98 20 92 Q 14 85 18 78 Q 22 72 30 70"
          fill="#E8671A"
          stroke="#C4550F"
          strokeWidth="1.5"
        />

        {/* ---- Pootjes ---- */}
        {/* achterste links */}
        <ellipse cx="26" cy="76" rx="7" ry="4" fill="#E8671A" stroke="#C4550F" strokeWidth="1" transform="rotate(-20 26 76)" />
        {/* achterste rechts */}
        <ellipse cx="74" cy="76" rx="7" ry="4" fill="#E8671A" stroke="#C4550F" strokeWidth="1" transform="rotate(20 74 76)" />
        {/* voorste links */}
        <ellipse cx="22" cy="58" rx="6" ry="3.5" fill="#E8671A" stroke="#C4550F" strokeWidth="1" transform="rotate(-30 22 58)" />
        {/* voorste rechts */}
        <ellipse cx="78" cy="58" rx="6" ry="3.5" fill="#E8671A" stroke="#C4550F" strokeWidth="1" transform="rotate(30 78 58)" />

        {/* ---- Lichaam ---- */}
        <ellipse cx="50" cy="62" rx="28" ry="20" fill="#F0821E" stroke="#C4550F" strokeWidth="1.5" />

        {/* Buik (lichtere kleur) */}
        <ellipse cx="50" cy="64" rx="18" ry="13" fill="#FFB347" />

        {/* Gele vlekken op rug */}
        <ellipse cx="38" cy="55" rx="5" ry="3.5" fill="#FFD700" opacity="0.8" transform="rotate(-15 38 55)" />
        <ellipse cx="62" cy="55" rx="5" ry="3.5" fill="#FFD700" opacity="0.8" transform="rotate(15 62 55)" />
        <ellipse cx="50" cy="52" rx="4" ry="3" fill="#FFD700" opacity="0.7" />

        {/* ---- Hoofd ---- */}
        <ellipse cx="50" cy="40" rx="24" ry="22" fill="#F0821E" stroke="#C4550F" strokeWidth="1.5" />

        {/* Wangen (roze blosjes) */}
        <ellipse cx="30" cy="48" rx="5" ry="3.5" fill="#FF8C69" opacity="0.5" />
        <ellipse cx="70" cy="48" rx="5" ry="3.5" fill="#FF8C69" opacity="0.5" />

        {/* ---- Ogen (wit) ---- */}
        <circle cx="38" cy="38" r="10" fill="white" stroke="#C4550F" strokeWidth="1" />
        <circle cx="62" cy="38" r="10" fill="white" stroke="#C4550F" strokeWidth="1" />

        {/* Pupillen */}
        <circle cx="39" cy="38" r={pupilR} fill="#2D1B0E" />
        <circle cx="63" cy="38" r={pupilR} fill="#2D1B0E" />

        {/* Oog glinstering */}
        <circle cx="41" cy="35" r="2" fill="white" />
        <circle cx="65" cy="35" r="2" fill="white" />

        {/* ---- Wenkbrauwen ---- */}
        <path d={leftBrow} stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={rightBrow} stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* ---- Mond ---- */}
        <path d={mouthPath} stroke="#8B3A0F" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* ---- Neusgaten ---- */}
        <ellipse cx="45" cy="44" rx="2" ry="1.5" fill="#C4550F" />
        <ellipse cx="55" cy="44" rx="2" ry="1.5" fill="#C4550F" />

        {/* ---- Accessoires per state ---- */}
        {state === 'proud' && (
          <g className="sami-star-badge">
            <text x="72" y="18" fontSize="18" textAnchor="middle">⭐</text>
          </g>
        )}
        {state === 'thinking' && (
          <g className="sami-think-bubble">
            <circle cx="76" cy="28" r="3" fill="white" opacity="0.9" />
            <circle cx="82" cy="20" r="5" fill="white" opacity="0.9" />
            <text x="82" y="14" fontSize="12" textAnchor="middle">?</text>
          </g>
        )}
        {state === 'sad' && (
          <g>
            <ellipse cx="34" cy="53" rx="2" ry="3" fill="#87CEEB" opacity="0.8" className="sami-tear" />
          </g>
        )}
        {(state === 'celebrating' || state === 'excited') && (
          <g>
            {/* Armpjes omhoog */}
            <line x1="22" y1="58" x2="12" y2="44" stroke="#C4550F" strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="58" x2="88" y2="44" stroke="#C4550F" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  )
}
