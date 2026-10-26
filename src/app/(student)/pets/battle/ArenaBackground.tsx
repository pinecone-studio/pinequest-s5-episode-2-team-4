import type { BossArena } from "@/lib/types";
import "./arena.css";

// Pixel-art battle scenes, drawn on a 320×180 grid with crisp edges.
// Original art made in code; particles animate with CSS (see arena.css).

/** Horizontal colour bands, top to bottom: a stepped pixel-art gradient. */
function Bands({ colors, from, to }: { colors: string[]; from: number; to: number }) {
  const h = (to - from) / colors.length;
  return colors.map((c, i) => (
    <rect key={c + i} x={0} y={from + i * h} width={320} height={h + 0.5} fill={c} />
  ));
}

/** Small squares at fixed spots; `className` animates them. */
function Dots({
  points,
  fill,
  size = 2,
  className,
}: {
  points: [number, number][];
  fill: string;
  size?: number;
  className?: string;
}) {
  return points.map(([x, y], i) => (
    <rect
      key={`${x}-${y}`}
      x={x}
      y={y}
      width={size}
      height={size}
      fill={fill}
      className={className}
      style={className ? { animationDelay: `${(i * 0.73) % 4}s` } : undefined}
    />
  ));
}

const STARS: [number, number][] = [
  [18, 14], [52, 30], [88, 10], [120, 26], [150, 8], [176, 34], [204, 16], [282, 12], [300, 40], [70, 52], [134, 46],
];

function Beach() {
  return (
    <>
      <Bands colors={["#7cc6ef", "#8fd0f2", "#a6dbf5", "#c0e7f8"]} from={0} to={100} />
      <circle cx={252} cy={28} r={20} fill="#fff8d6" opacity={0.5} />
      <circle cx={252} cy={28} r={14} fill="#fff2a8" />
      <g fill="#ffffff">
        <rect x={40} y={24} width={36} height={8} />
        <rect x={48} y={18} width={20} height={6} />
        <rect x={150} y={36} width={30} height={6} />
        <rect x={156} y={31} width={14} height={5} />
      </g>
      <polygon points="0,100 30,88 62,92 96,100" fill="#6aa37a" />
      <rect x={0} y={100} width={320} height={34} fill="#2d7fcf" />
      <rect x={0} y={100} width={320} height={8} fill="#3b8fdc" />
      <Dots
        points={[[20, 108], [70, 116], [120, 110], [180, 120], [230, 112], [280, 124], [44, 126], [150, 128]]}
        fill="#a6dcff"
        size={6}
        className="arena-shimmer"
      />
      <rect x={0} y={134} width={320} height={46} fill="#f0d297" />
      <rect x={0} y={134} width={320} height={4} fill="#d9b97c" />
      <Dots
        points={[[30, 150], [64, 166], [110, 154], [168, 170], [206, 152], [250, 164], [92, 174], [140, 160]]}
        fill="#ddb877"
        size={3}
      />
      <rect x={60} y={158} width={5} height={3} fill="#f39cb0" />
      <rect x={224} y={172} width={4} height={3} fill="#f7b6c4" />
      {/* Palm tree on the right */}
      <rect x={298} y={92} width={6} height={50} fill="#9a6a3c" />
      <polygon points="300,92 274,100 284,90" fill="#3f9b58" />
      <polygon points="302,92 320,104 314,88" fill="#3f9b58" />
      <polygon points="300,90 290,74 306,84" fill="#56b56c" />
    </>
  );
}

function Reef() {
  return (
    <>
      <Bands colors={["#4cc3e6", "#36a9d6", "#2790c3", "#1b76ac", "#135d92", "#0d4778"]} from={0} to={150} />
      <g fill="#ffffff" className="arena-shimmer">
        <polygon points="60,0 86,0 140,150 104,150" opacity={0.08} />
        <polygon points="170,0 186,0 226,150 200,150" opacity={0.07} />
        <polygon points="250,0 262,0 300,150 282,150" opacity={0.06} />
      </g>
      <polygon points="0,150 40,124 90,140 140,128 200,144 260,122 320,140 320,152 0,152" fill="#0f4f6e" />
      <rect x={0} y={150} width={320} height={30} fill="#d8c18b" />
      <rect x={0} y={150} width={320} height={3} fill="#c9ae74" />
      {[[18, 40], [34, 56], [272, 48], [296, 64]].map(([x, h]) => (
        <g key={x} className="arena-sway">
          <rect x={x} y={152 - h} width={5} height={h} fill="#2f9e5a" />
          <rect x={x + 3} y={152 - h + 8} width={4} height={h - 8} fill="#227a45" />
        </g>
      ))}
      <g fill="#f06b8b">
        <rect x={52} y={140} width={8} height={12} />
        <rect x={48} y={134} width={5} height={8} />
        <rect x={58} y={132} width={5} height={10} />
      </g>
      <g fill="#ff9f5a">
        <rect x={238} y={142} width={10} height={10} />
        <rect x={234} y={136} width={5} height={8} />
        <rect x={246} y={134} width={5} height={10} />
      </g>
      {[[40, 120, 3], [84, 140, 2], [130, 130, 4], [196, 138, 2], [222, 120, 3], [286, 132, 2], [160, 146, 3]].map(
        ([x, y, r], i) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r={r}
            fill="none"
            stroke="#e6f7ff"
            strokeWidth={1}
            className="arena-rise"
            style={{ animationDelay: `${i * 0.9}s` }}
          />
        ),
      )}
    </>
  );
}

function Volcano() {
  return (
    <>
      <Bands colors={["#1e0b16", "#33101f", "#521726", "#7c1f2a", "#ad3029", "#e0582a"]} from={0} to={110} />
      <polygon points="0,110 40,84 80,100 120,80 170,110" fill="#4a1c26" />
      <polygon points="150,110 205,38 235,38 290,110" fill="#2e1519" />
      <rect x={205} y={34} width={30} height={5} fill="#ff8a1e" />
      <polygon points="214,39 220,39 212,82 206,82" fill="#ff6a13" />
      <polygon points="226,39 231,39 248,92 242,92" fill="#ff6a13" />
      {[[214, 24, 8], [228, 14, 10], [218, 4, 7]].map(([x, y, r], i) => (
        <circle
          key={y}
          cx={x}
          cy={y}
          r={r}
          fill="#3b2a2e"
          opacity={0.6}
          className="arena-rise-slow"
          style={{ animationDelay: `${i * 1.3}s` }}
        />
      ))}
      <rect x={0} y={110} width={320} height={70} fill="#2a171b" />
      <rect x={0} y={110} width={320} height={4} fill="#3a1f24" />
      <g stroke="#ff5a1f" strokeWidth={2} fill="none">
        <polyline points="20,140 44,148 60,144 86,156" />
        <polyline points="180,130 200,138 214,134 236,146 250,142" />
        <polyline points="120,168 140,162 160,172" />
      </g>
      <Dots points={[[70, 126], [150, 150], [270, 160], [300, 128]]} fill="#1a0e11" size={6} />
      <Dots
        points={[[40, 150], [100, 160], [160, 140], [210, 156], [260, 150], [290, 170], [130, 120]]}
        fill="#ffb347"
        size={2}
        className="arena-rise"
      />
    </>
  );
}

function Desert() {
  return (
    <>
      <Bands colors={["#4b2a6b", "#6d3577", "#9a4173", "#cc566d", "#ee7a5f", "#f7a463"]} from={0} to={124} />
      <Dots points={STARS.slice(0, 6)} fill="#ffe9c7" className="arena-twinkle" />
      <circle cx={64} cy={94} r={18} fill="#ffd27a" opacity={0.9} />
      <polygon points="178,100 190,58 242,58 252,100" fill="#8e4a3a" />
      <rect x={190} y={58} width={52} height={5} fill="#a85a44" />
      <polygon points="252,100 264,70 304,70 320,100" fill="#7d3f31" />
      <rect x={264} y={70} width={40} height={4} fill="#99503d" />
      <polygon points="0,122 60,104 130,116 200,104 260,114 320,106 320,130 0,130" fill="#c97a45" />
      <rect x={0} y={124} width={320} height={56} fill="#e3a463" />
      <g stroke="#b9783f" strokeWidth={1.5} fill="none">
        <polyline points="40,140 60,146 70,158 92,162" />
        <polyline points="200,150 220,144 236,156 262,152" />
        <polyline points="140,172 160,166 176,176" />
      </g>
      <Dots points={[[110, 136], [250, 168], [300, 140]]} fill="#a46a3c" size={6} />
      {/* Cactus */}
      <rect x={24} y={104} width={6} height={26} fill="#4f8a3c" />
      <rect x={18} y={110} width={4} height={10} fill="#4f8a3c" />
      <rect x={32} y={108} width={4} height={8} fill="#4f8a3c" />
    </>
  );
}

function Bamboo() {
  return (
    <>
      <Bands colors={["#0b1428", "#101d38", "#17284a", "#1f355c"]} from={0} to={128} />
      <Dots points={STARS} fill="#dfe7ff" className="arena-twinkle" />
      <circle cx={240} cy={36} r={16} fill="#f3efcf" />
      <circle cx={234} cy={32} r={3} fill="#dcd6ad" />
      <circle cx={246} cy={42} r={2} fill="#dcd6ad" />
      {[8, 40, 66, 100, 214, 262, 290].map((x) => (
        <rect key={x} x={x} y={20} width={6} height={110} fill="#12301f" />
      ))}
      {[22, 56, 276, 306].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={8} height={132} fill="#2f7d4a" />
          {[24, 50, 76, 102].map((y) => (
            <rect key={y} x={x} y={y} width={8} height={3} fill="#24603a" />
          ))}
          <polygon points={`${x + 8},${30} ${x + 22},${24} ${x + 10},${34}`} fill="#3f9b58" />
        </g>
      ))}
      <rect x={0} y={112} width={320} height={14} fill="#ffffff" opacity={0.07} className="arena-drift" />
      <rect x={0} y={128} width={320} height={52} fill="#183a26" />
      <rect x={0} y={128} width={320} height={3} fill="#21492f" />
      <Dots points={[[44, 140], [120, 160], [190, 146], [240, 170], [96, 172]]} fill="#2b6a40" size={4} />
      <Dots
        points={[[60, 100], [130, 80], [180, 110], [230, 90], [150, 120], [90, 70]]}
        fill="#fff27a"
        size={2}
        className="arena-twinkle"
      />
    </>
  );
}

function City() {
  const windows: [number, number][] = [];
  for (const [bx, by, bw] of [[10, 50, 34], [52, 66, 26], [196, 40, 30], [234, 58, 38], [282, 46, 30]]) {
    for (let y = by + 6; y < 112; y += 10) {
      for (let x = bx + 4; x < bx + bw - 4; x += 8) {
        if ((x * 7 + y * 3) % 5 !== 0) windows.push([x, y]);
      }
    }
  }
  return (
    <>
      <Bands colors={["#0d0c22", "#15133a", "#1f1b52", "#2b2366"]} from={0} to={120} />
      <Dots points={STARS} fill="#cfd6ff" className="arena-twinkle" />
      <g fill="#1c1a40">
        <rect x={10} y={50} width={34} height={70} />
        <rect x={52} y={66} width={26} height={54} />
        <rect x={196} y={40} width={30} height={80} />
        <rect x={234} y={58} width={38} height={62} />
        <rect x={282} y={46} width={30} height={74} />
      </g>
      {windows.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={3} height={4} fill={(x + y) % 3 === 0 ? "#3fd0f0" : "#ffd166"} opacity={0.85} />
      ))}
      <rect x={200} y={46} width={22} height={6} fill="#e30ba6" className="arena-shimmer" />
      <rect x={0} y={120} width={320} height={60} fill="#2c3050" />
      <rect x={0} y={120} width={320} height={2} fill="#3fd0f0" />
      <g stroke="#4a5280" strokeWidth={1}>
        {[130, 144, 162].map((y) => (
          <line key={y} x1={0} y1={y} x2={320} y2={y} />
        ))}
        {[-160, -60, 40, 120, 200, 280, 380, 480].map((x) => (
          <line key={x} x1={160} y1={122} x2={x} y2={180} />
        ))}
      </g>
    </>
  );
}

const SCENES: Record<BossArena, () => React.ReactNode> = {
  beach: Beach,
  reef: Reef,
  volcano: Volcano,
  desert: Desert,
  bamboo: Bamboo,
  city: City,
};

export function ArenaBackground({ arena, className }: { arena: BossArena; className?: string }) {
  const Scene = SCENES[arena];
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <Scene />
    </svg>
  );
}
