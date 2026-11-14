// An illustrated American main street at golden hour: brownstones, a café,
// a market, a diner and a clinic (the game's places), with a taxi driving by.

const GROUND = 270

function Windows(props: { x: number; y: number; cols: number; rows: number; w?: number; h?: number; gapX: number; gapY: number; lit?: number[] }) {
  const { x, y, cols, rows, w = 22, h = 30, gapX, gapY, lit = [] } = props
  const cells = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      cells.push(
        <g key={i}>
          <rect x={x + c * gapX} y={y + r * gapY} width={w} height={h} rx={2} fill={lit.includes(i) ? '#FFD98A' : '#3C4A6B'} />
          <rect x={x + c * gapX - 3} y={y + r * gapY + h} width={w + 6} height={4} fill="#00000022" />
        </g>,
      )
    }
  return <>{cells}</>
}

function Awning(props: { x: number; y: number; w: number; color: string }) {
  const stripes = Math.floor(props.w / 20)
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => (
        <path
          key={i}
          d={`M${props.x + i * 20} ${props.y} h20 l4 26 q-12 8 -24 0 z`}
          fill={i % 2 ? '#FFF6E6' : props.color}
        />
      ))}
    </g>
  )
}

function Lamp({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 3} y={GROUND - 120} width={6} height={124} fill="#22345C" />
      <path d={`M${x - 14} ${GROUND - 126} h28 l-6 -18 h-16 z`} fill="#22345C" />
      <circle cx={x} cy={GROUND - 128} r={7} fill="#FFE3A3" className="lamp-glow" />
    </g>
  )
}

function Tree({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 5} y={GROUND - 60} width={10} height={64} fill="#6B4A32" />
      <circle cx={x} cy={GROUND - 84} r={34} fill="#5E9E6E" />
      <circle cx={x - 22} cy={GROUND - 66} r={22} fill="#4F8C60" />
      <circle cx={x + 20} cy={GROUND - 70} r={24} fill="#6BAE7A" />
    </g>
  )
}

function Taxi() {
  return (
    <g className="taxi-drive">
      <g transform="translate(0 296)">
        <path d="M0 34 q0 -14 14 -16 l22 -2 l20 -18 h52 l22 18 l26 4 q12 2 12 14 v8 h-168 z" fill="#F5B82E" />
        <path d="M44 16 l14 -13 h18 v13 z M82 3 h22 l16 13 h-38 z" fill="#9CC3E6" />
        <rect x={66} y={-7} width={26} height={9} rx={2} fill="#2B1D16" />
        <text x={79} y={0.5} textAnchor="middle" fontSize={7} fontWeight={800} fill="#F5B82E">TAXI</text>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={30 + i * 12} y={26} width={6} height={6} fill={i % 2 ? '#2B1D16' : '#F5B82E'} />
        ))}
        <rect x={150} y={24} width={8} height={6} rx={2} fill="#FFF3C2" />
        <circle cx={38} cy={42} r={12} fill="#2B1D16" />
        <circle cx={38} cy={42} r={5} fill="#BDB6AA" />
        <circle cx={130} cy={42} r={12} fill="#2B1D16" />
        <circle cx={130} cy={42} r={5} fill="#BDB6AA" />
      </g>
    </g>
  )
}

export function StreetScene() {
  return (
    <svg
      viewBox="0 0 1440 360"
      preserveAspectRatio="xMidYMax slice"
      className="block h-full w-full"
      aria-hidden
      fontFamily="'Be Vietnam Pro', system-ui, sans-serif"
    >
      {/* hazy skyline */}
      <g fill="#F2C9A0">
        <rect x={40} y={20} width={70} height={250} />
        <rect x={260} y={0} width={50} height={270} />
        <rect x={520} y={30} width={90} height={240} />
        <rect x={760} y={10} width={60} height={260} />
        <path d="M985 270 V40 h40 v-30 h12 v30 h40 v230 z" />
        <rect x={1200} y={24} width={80} height={246} />
        <rect x={1360} y={0} width={60} height={270} />
      </g>

      {/* 1. brownstone with stoop */}
      <rect x={0} y={40} width={180} height={230} fill="#9C4A35" />
      <rect x={0} y={34} width={186} height={10} fill="#7A3626" />
      <Windows x={22} y={64} cols={3} rows={4} gapX={52} gapY={46} lit={[1, 5, 9]} />
      <path d="M60 270 v-26 h60 v26 z" fill="#7A3626" />
      <path d="M50 270 h80 v-6 h-80 z M56 264 h68 v-6 h-68 z M62 258 h56 v-6 h-56 z" fill="#C9B79C" />

      {/* 2. café */}
      <rect x={190} y={90} width={230} height={180} fill="#B5523B" />
      <rect x={190} y={84} width={236} height={10} fill="#8E3F2E" />
      <Windows x={214} y={108} cols={4} rows={1} gapX={52} gapY={0} lit={[2]} />
      <rect x={232} y={152} width={146} height={28} rx={4} fill="#2B1D16" />
      <text x={305} y={172} textAnchor="middle" fontSize={17} fontWeight={800} letterSpacing={3} fill="#FFE3A3">
        COFFEE
      </text>
      <Awning x={200} y={186} w={220} color="#2F7F7A" />
      <rect x={210} y={216} width={120} height={54} fill="#FFE7B8" opacity={0.9} />
      <path d="M232 250 h14 v12 h-14 z M262 246 h14 v16 h-14 z M292 250 h14 v12 h-14 z" fill="#B5523B" opacity={0.6} />
      <rect x={348} y={214} width={48} height={56} fill="#2B1D16" />
      <circle cx={388} cy={244} r={2.5} fill="#F5B82E" />
      {/* sidewalk A-frame sign */}
      <path d="M404 270 l10 -34 h20 l10 34" fill="#2B1D16" />
      <text x={424} y={258} textAnchor="middle" fontSize={7} fontWeight={700} fill="#FFF6E6">OPEN</text>

      {/* 3. market */}
      <rect x={450} y={110} width={200} height={160} fill="#2F7F7A" />
      <rect x={450} y={104} width={206} height={10} fill="#22605C" />
      <text x={550} y={142} textAnchor="middle" fontSize={20} fontWeight={800} letterSpacing={4} fill="#FFF6E6">
        MARKET
      </text>
      <Awning x={456} y={156} w={194} color="#E8553D" />
      <rect x={468} y={190} width={110} height={80} fill="#FFE7B8" opacity={0.9} />
      <rect x={594} y={192} width={42} height={78} fill="#173F3C" />
      {/* produce crates */}
      <rect x={462} y={246} width={52} height={24} fill="#A86B3C" />
      <rect x={520} y={246} width={52} height={24} fill="#A86B3C" />
      {[470, 482, 494, 506].map((cx) => <circle key={cx} cx={cx} cy={244} r={6} fill="#E8553D" />)}
      {[528, 540, 552, 564].map((cx) => <circle key={cx} cx={cx} cy={244} r={6} fill="#F5B82E" />)}

      {/* 4. diner */}
      <rect x={668} y={140} width={210} height={130} rx={10} fill="#F3E3C3" />
      <rect x={668} y={206} width={210} height={10} fill="#E8553D" />
      <rect x={668} y={222} width={210} height={4} fill="#E8553D" />
      <rect x={714} y={112} width={118} height={36} rx={18} fill="#22345C" />
      <text x={773} y={137} textAnchor="middle" fontSize={20} fontWeight={800} letterSpacing={4} fill="#FF8FA3" className="neon">
        DINER
      </text>
      {[688, 738, 788].map((x) => (
        <rect key={x} x={x} y={160} width={40} height={38} rx={6} fill="#9CC3E6" />
      ))}
      <rect x={838} y={164} width={28} height={106} rx={4} fill="#22345C" />

      <Tree x={900} />

      {/* 5. brownstone */}
      <rect x={936} y={60} width={140} height={210} fill="#C8774E" />
      <rect x={932} y={54} width={148} height={10} fill="#A35C38" />
      <Windows x={956} y={82} cols={3} rows={3} gapX={38} gapY={48} lit={[4]} />
      <rect x={986} y={230} width={40} height={40} fill="#6B3A22" />

      {/* 6. clinic */}
      <rect x={1092} y={100} width={200} height={170} fill="#EDE6DA" />
      <rect x={1088} y={94} width={208} height={10} fill="#CFC5B4" />
      <rect x={1118} y={118} width={148} height={34} rx={6} fill="#FFFFFF" stroke="#CFC5B4" strokeWidth={2} />
      <path d="M1134 128 h6 v-6 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 z" fill="#E8553D" transform="translate(0 4)" />
      <text x={1212} y={142} textAnchor="middle" fontSize={16} fontWeight={800} letterSpacing={3} fill="#22345C">
        CLINIC
      </text>
      <Windows x={1112} y={170} cols={2} rows={1} w={40} h={40} gapX={118} gapY={0} lit={[0]} />
      <rect x={1170} y={206} width={44} height={64} rx={4} fill="#3E6FB0" />
      <rect x={1162} y={200} width={60} height={8} fill="#22345C" />

      {/* 7. corner brick */}
      <rect x={1306} y={50} width={134} height={220} fill="#8E3F2E" />
      <Windows x={1324} y={74} cols={3} rows={4} gapX={36} gapY={46} lit={[2, 7]} />

      {/* sidewalk, curb, road */}
      <rect x={0} y={GROUND} width={1440} height={26} fill="#D9CDBA" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={i * 62} y={GROUND} width={2} height={26} fill="#C4B7A2" />
      ))}
      <rect x={0} y={GROUND + 26} width={1440} height={6} fill="#B2A48D" />
      <rect x={0} y={GROUND + 32} width={1440} height={58} fill="#4A4A55" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={i * 84 + 20} y={GROUND + 62} width={44} height={4} rx={2} fill="#F5B82E" />
      ))}
      {/* crosswalk */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={1300 + i * 20} y={GROUND + 36} width={12} height={50} fill="#F4EFE6" />
      ))}

      {/* props */}
      <Lamp x={438} />
      <Lamp x={1084} />
      <g>
        <rect x={658} y={GROUND - 22} width={14} height={24} rx={4} fill="#E8553D" />
        <rect x={654} y={GROUND - 14} width={22} height={5} rx={2} fill="#C23F2B" />
        <circle cx={665} cy={GROUND - 24} r={7} fill="#E8553D" />
      </g>
      <g>
        <rect x={1298} y={GROUND - 110} width={6} height={114} fill="#22345C" />
        <rect x={1286} y={GROUND - 160} width={30} height={60} rx={6} fill="#22345C" />
        <circle cx={1301} cy={GROUND - 148} r={6} fill="#5A2A24" />
        <circle cx={1301} cy={GROUND - 131} r={6} fill="#5A4A24" />
        <circle cx={1301} cy={GROUND - 114} r={6} fill="#6BE38A" className="lamp-glow" />
      </g>

      <Taxi />
    </svg>
  )
}
