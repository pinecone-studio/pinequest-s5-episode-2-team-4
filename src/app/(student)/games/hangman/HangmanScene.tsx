import type { CSSProperties } from "react";

type SceneProps = { mistakes: number; won: boolean; lost: boolean };
const BALLOONS = [
  { x: 112, y: 52, color: "#f55cbd" }, { x: 144, y: 32, color: "#ffcf5a" },
  { x: 176, y: 44, color: "#a780ff" }, { x: 212, y: 32, color: "#ff759b" },
  { x: 240, y: 52, color: "#ff995c" }, { x: 208, y: 68, color: "#42d9bd" },
];
const EXPLORER = [
  "....OOOO....", "..OOPPPPOO..", ".OPPPPPPPPO.", "OPPPLLLLPPPO",
  "OOOLLLLLLOOO", "..OLKLLKLO..", "..OLLLLLLO..", "...OLMMLO...",
  "....OOOO....", "..OOVVVVOO..", ".OLLVVVVLLO.", ".OLLVYVVLLO.",
  "..OOVVVVOO..", "...OVVVVO...", "...OVVVVO...", "....OOOO....",
  "...OCC CCO..", "...OCC CCO..", "..OCCC CCCO.", "..OOOO OOOO.",
];
const MONSTER = [
  "...OO..........OO...", "..OPPO........OPPO..", "..OPPPOOOOOOOOPPPO..",
  "..OPPPPPPPPPPPPPPO..", ".OPPPPPPPPPPPPPPPPO.", "OPPPPPPPPPPPPPPPPPPO",
  "OPPWWWWPPPPWWWWPPPPO", "OPPWWKKPPPPWWKKPPPPO", "OPPWWKKPPPPWWKKPPPPO",
  "OPPPPPPPPPPPPPPPPPPO", "OPPPPOOOOOOOOOPPPPPO", "OPPPPOWOWOWOWOPPPPPO",
  "OPPPPOOOOOOOOOPPPPPO", ".OPPPPPPPPPPPPPPPPO.", "..OPPPPPPPPPPPPPPO..",
  "...OOPPOOOOOPPOO....", "...OPPPO...OPPPO....", "...OOOOO...OOOOO....",
];

/** Every sprite is made of 4px squares, with no smooth outline or external image. */
function Sprite({ rows, x, y, palette }: { rows: string[]; x: number; y: number; palette: Record<string, string> }) {
  return <g>{rows.flatMap((row, sy) => [...row].flatMap((pixel, sx) => palette[pixel]
    ? [<rect key={`${sx}-${sy}`} x={x + sx * 4} y={y + sy * 4} width="4" height="4" fill={palette[pixel]} />] : []))}</g>;
}

export function HangmanForest() {
  return <g aria-hidden="true">
    <path d="M0 0h360v360H0Z" fill="#171030" />
    <path d="M0 136h24v-16h32v20h24v-36h32v28h32v-20h24v40h32v-20h32v-24h32v36h24v-16h40v24h32v-8h32v216H0Z" fill="#251a49" />
    <path d="M284 28h28v8h8v24h-8v8h-28v-8h-8V36h8Z" fill="#ffdfa0" />
    <path d="M300 28h12v8h8v24h-8v8h-12v-8h8V36h-8Z" fill="#e8bc7e" />
    {[ [24,24], [80,56], [132,16], [224,100], [336,88], [44,100], [320,148], [120,108] ].map(([x,y]) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="#a391da" />)}
    {[12,76,264,316].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 176 : 144})`}>
      <path d="M20 0h8v16h8v16h8v16h8v16h-8v16H0V64h8V48h8V32h4Z" fill={i % 2 ? "#42306b" : "#34265a"} />
      <path d="M20 80h12v88H20Z" fill="#271c44" />
      <path d="M20 16h8v16h8v16h8v16h-8V48h-8V32h-8Z" fill="#59427e" />
    </g>)}
    <path d="M0 312h360v48H0Z" fill="#221735" />
    <path d="M0 308h24v8h24v-8h36v8h32v-8h32v8h32v-8h36v8h32v-8h44v8h24v-8h44v12H0Z" fill="#664784" />
    <path d="M0 324h48v4H0m88 12h28v4H88m128-20h48v4h-48m80 16h28v4h-28" fill="#392548" />
    <path d="M28 304h12v-8h8v16H28m272-8h8v-8h8v16h-16" fill="#9870ad" />
  </g>;
}

export function HangmanScene({ mistakes, won, lost }: SceneProps) {
  const explorer = EXPLORER.map((row, i) => i === 7 ? (lost ? "...OLWWLO..." : won ? "...OLWWLO..." : row) : row);
  return (
    <div className={`hangman-scene ${won ? "is-won" : lost ? "is-lost" : ""}`} style={{ "--descent": `${mistakes * 12}px` } as CSSProperties}>
      <svg viewBox="0 0 360 360" role="img" aria-label={won ? "Яллаа! Pixel аялагч аврагдлаа." : lost ? "6 бөмбөлөг хагарлаа. Дахин оролдоорой." : `${6 - mistakes} бөмбөлөг үлдлээ. Аялагчийг авраарай.`} className="hangman-scene-svg" shapeRendering="crispEdges">
        <HangmanForest />
        <path d="M152 312h48v4h-48Z" fill="#120d21" />
        <g className="hangman-flight-position"><g className="hangman-flight-sway">
          {BALLOONS.map((balloon, index) => <g key={index} className={`hangman-balloon ${index < mistakes ? "is-popped" : ""}`} style={{ "--balloon-x": `${balloon.x}px`, "--balloon-y": `${balloon.y}px` } as CSSProperties}>
            <path className="hangman-string" d={`M${balloon.x} ${balloon.y + 24} V${balloon.y + 36} H${balloon.x + (176 > balloon.x ? 12 : -12)} V120 H176 V144`} stroke="#b2a0dc" strokeWidth="2" fill="none" />
            <g transform={`translate(${balloon.x} ${balloon.y})`}><g className="hangman-balloon-body">
              <path d="M-8-28H8v4h8v8h4V8h-4v8H8v8H-8v-8h-8V8h-4v-24h4v-8h8Z" fill="#100b22" />
              <path d="M-8-24H8v4h8V8h-4v8H4v4h-8v-4h-8V8h-4v-28h8Z" fill={balloon.color} />
              <path d="M8-20h8V8h-4v8H4v4h-8v-8h8V4h4Z" fill="#26133f" opacity=".24" />
              <path d="M-8-16h8v4h-4v12h-4Z" fill="#fff" opacity=".6" />
              <path d="M-4 24h8v4h-8Z" fill={balloon.color} />
            </g></g>
          </g>)}
          <Sprite rows={explorer} x={152} y={144} palette={{ O:"#100b22",P:"#a780ff",L:"#ffd9ad",K:lost?"#ef6193":"#271836",M:"#a95a65",W:won?"#fff0c8":"#a95a65",V:"#7452c7",Y:"#ffcf5a",C:"#4c3c7d" }} />
        </g></g>
        <g className="hangman-monster"><Sprite rows={MONSTER} x={48} y={240} palette={{O:"#100b22",P:lost?"#d65bad":"#8b61d5",W:"#fff4d6",K:"#28203d"}} /></g>
        {won && <g className="hangman-victory-stars" fill="#ffcf5a"><path d="M60 68h4v8h8v4h-8v8h-4v-8h-8v-4h8Zm228 32h4v8h8v4h-8v8h-4v-8h-8v-4h8Z" /></g>}
      </svg>
      {won && <div className="hangman-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--piece": i, left: `${8 + (i * 19) % 84}%`, backgroundColor: BALLOONS[i % BALLOONS.length].color } as CSSProperties} />)}</div>}
    </div>
  );
}
