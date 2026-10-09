// Фон шапки: парковка, вид сверху. Номера занятых мест (от 0); на свободных рисуется «P»
const HERO_STALL_W = 62;
const HERO_STALLS = 23;
// Сначала знак «P», затем парковка с места HERO_LOT_START
const HERO_LOT_START = 3;
const HERO_LAMPS = [420, 640, 888, 1136];
const HERO_PARKED = [4, 5, 8, 9, 10, 12, 13, 15, 17, 18, 20, 22];

// Машина сверху (передом вверх), 40×58
const TopCar = ({ x, suv }) => (
  <g transform={`translate(${x + 3.6} 15.2) scale(0.82)`}>
    <rect x="-3" y="22" width="4" height="7" rx="2" fill="#fff" opacity="0.8" />
    <rect x="39" y="22" width="4" height="7" rx="2" fill="#fff" opacity="0.8" />
    <rect width="40" height="58" rx="14" fill="url(#heroCar)" />
    <path d="M8 20Q20 15 32 20L30 28Q20 25 10 28Z" fill="#4338ca" opacity="0.6" />
    <rect x="9" y="29" width="22" height={suv ? 18 : 12} rx="4" fill="#4338ca" opacity="0.14" />
    <path
      d={suv ? "M10 49Q20 52 30 49L32 54Q20 57 8 54Z" : "M10 43Q20 46 30 43L32 49Q20 52 8 49Z"}
      fill="#4338ca"
      opacity="0.5"
    />
    <rect x="5" y="3" width="9" height="3" rx="1.5" fill="#4338ca" opacity="0.35" />
    <rect x="26" y="3" width="9" height="3" rx="1.5" fill="#4338ca" opacity="0.35" />
  </g>
);

const ParkingHeroBg = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 1400 80"
    preserveAspectRatio="xMaxYMid meet"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="heroGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="heroAsphalt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.16" />
      </linearGradient>
      <linearGradient id="heroCar" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#c7d2fe" />
      </linearGradient>
    </defs>

    {/* асфальт */}
    <rect x="0" y="0" width="1400" height="80" fill="url(#heroAsphalt)" />

    {/* подвесные фонари с мягким светом на места */}
    {HERO_LAMPS.map((x) => (
      <g key={x}>
        <path d={`M${x - 9} 8L${x - 40} 76h80L${x + 9} 8z`} fill="url(#heroGlow)" />
        <path d={`M${x} 0v5`} stroke="#fff" strokeWidth="2" />
        <rect x={x - 10} y="4" width="20" height="4" rx="2" fill="#fff" opacity="0.95" />
      </g>
    ))}

    {/* разметка мест */}
    <g stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55">
      {Array.from({ length: HERO_STALLS + 1 }, (_, k) =>
        k < HERO_LOT_START ? null : (
          <path key={k} d={`M${20 + HERO_STALL_W * k} 4v72`} />
        ),
      )}
    </g>

    {/* упоры и «P» на асфальте у всех свободных мест */}
    {Array.from({ length: HERO_STALLS }, (_, k) =>
      k < HERO_LOT_START || HERO_PARKED.includes(k) ? null : (
        <g key={k}>
          <rect
            x={20 + HERO_STALL_W * k + 15}
            y="8"
            width="32"
            height="4"
            rx="2"
            fill="#fff"
            opacity="0.4"
          />
          <text
            x={20 + HERO_STALL_W * k + HERO_STALL_W / 2}
            y="44"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="34"
            fontWeight="800"
            fontFamily="Nunito, Arial, sans-serif"
            fill="#fff"
            opacity="0.6"
          >
            P
          </text>
        </g>
      ),
    )}

    {/* машины */}
    {HERO_PARKED.map((k, i) => (
      <TopCar key={k} x={20 + HERO_STALL_W * k + 11} suv={i % 3 === 1} />
    ))}

    {/* знак парковки «P» на стойке */}
    <g>
      <path d="M120 78V40" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <rect x="107" y="12" width="26" height="26" rx="6" fill="#fff" opacity="0.95" />
      <text
        x="120"
        y="26"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="800"
        fontFamily="Nunito, Arial, sans-serif"
        fill="#4338ca"
      >
        P
      </text>
    </g>

    {/* проезд */}
    <path d="M0 78h1400" stroke="#fff" strokeWidth="2" opacity="0.55" />
  </svg>
);

export default ParkingHeroBg;
