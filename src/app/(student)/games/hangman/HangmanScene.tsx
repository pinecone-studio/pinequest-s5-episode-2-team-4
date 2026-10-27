import type { CSSProperties } from "react";

type SceneProps = { mistakes: number; won: boolean; lost: boolean };
const BALLOONS = [
  { x: 113, y: 52, color: "#ba586a" },
  { x: 145, y: 33, color: "#a69a49" },
  { x: 178, y: 43, color: "#86638d" },
  { x: 211, y: 31, color: "#b85670" },
  { x: 240, y: 53, color: "#b78750" },
  { x: 207, y: 66, color: "#4f9476" },
];

export function HangmanForest() {
  return <g aria-hidden="true" stroke="none">
    <path d="M0 308h360v52H0z" fill="#f6f6f4" />
    <g fill="#e4e4e1">
      <path d="M12 321 27 224 13 174l11-5 15 29 3-85 12-6 2 83 24-37 9 5-28 68-5 95ZM294 320l-6-91-24-57 9-5 19 27 4-93 13 2 5 72 21-28 9 7-27 64 13 102Z" />
      <path d="m77 320 11-60-13-50 10-5 15 28 7-60 9 2 1 68 18-19 7 6-25 40-6 50ZM243 319l-7-59-16-27 8-6 13 14 2-58 10 1 4 64 15-19 8 7-22 41 1 42Z" />
    </g>
    <g fill="#cccfc9">
      <ellipse cx="27" cy="324" rx="13" ry="6" /><ellipse cx="303" cy="325" rx="19" ry="7" />
      <path d="M41 326q-9-24-16-11-6-30-13 2v9ZM268 327q-5-24-13-10-8-29-15 8Z" />
      <ellipse cx="88" cy="344" rx="8" ry="4" /><ellipse cx="229" cy="346" rx="9" ry="4" />
    </g>
  </g>;
}

/** Each lost chance pops one balloon; the surviving balloons carry the explorer. */
export function HangmanScene({ mistakes, won, lost }: SceneProps) {
  return (
    <div className={`hangman-scene ${won ? "is-won" : lost ? "is-lost" : ""}`} style={{ "--descent": `${mistakes * 13}px` } as CSSProperties}>
      <svg viewBox="0 0 360 360" role="img" aria-label={won ? "Яллаа! Бөмбөлөгтэй аялагч дээш хөөрлөө." : lost ? "Бүх 6 бөмбөлөг хагарлаа. Дахин оролдоорой." : `${6 - mistakes} бөмбөлөг үлдлээ. Аялагчийг авраарай.`} className="hangman-scene-svg" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <HangmanForest />
        <ellipse cx="176" cy="320" rx="23" ry="5" fill="#d9dbd5" />
        <g className="hangman-flight-position">
          <g className="hangman-flight-sway">
            {BALLOONS.map((balloon, index) => (
              <g key={index} className={`hangman-balloon ${index < mistakes ? "is-popped" : ""}`} style={{ "--balloon-x": `${balloon.x}px`, "--balloon-y": `${balloon.y}px` } as CSSProperties}>
                <path className="hangman-string" d={`M${balloon.x} ${balloon.y + 25} 177 138`} stroke="#262925" strokeWidth="1.7" />
                <g className="hangman-balloon-body">
                  <ellipse cx={balloon.x} cy={balloon.y} rx="21" ry="27" fill={balloon.color} />
                  <path d={`m${balloon.x} ${balloon.y + 25}-4 6h8Z`} fill={balloon.color} />
                  <ellipse cx={balloon.x - 8} cy={balloon.y - 9} rx="4" ry="7" fill="#fff" opacity=".3" />
                </g>
              </g>
            ))}
            <g className="hangman-explorer" stroke="#20221f" strokeWidth="4" fill="#fffef9">
              <path d="m173 176-10-26 14-12 12 12-5 26" />
              <path d="M164 200v22l-10 9m32-31v22l10 9" fill="none" />
              <path d="M168 176q-11 11-10 28l17-4 18 4q0-18-12-28" />
              <circle cx="175" cy="162" r="19" />
              <path d="M157 155q13-26 35 1l-12-5-22 6" fill="#fffef9" />
              <path d="m179 184-4 7 4 8" fill="none" />
              <g strokeWidth="2.2">
                {lost ? <><path d="m166 160 4 4m0-4-4 4m14-4 4 4m0-4-4 4m-14 10q8-7 16 0" /></> : <><path d="M167 161v2m15-2v2" /><path d={won ? "M167 169q8 11 16 0" : "M169 171q6 5 12-1"} /></>}
              </g>
            </g>
          </g>
        </g>
        <g className="hangman-monster" stroke="#20221f" strokeWidth="3" fill="#20221f">
          <path d="M62 302q-18-16-7-42l-3-12 16 7q8-10 18-8l12-12 5 15q22 5 21 27l10 10-8 8q1 23-20 24l-7-5-10 7-12-6q-16 5-15-13Z" />
          <path d="M71 267q8 9 15-2m10-2q7 8 13-1" stroke="#fff" strokeWidth="6" />
          <path className="hangman-monster-mouth" d={lost ? "M76 291q19-25 38-1-18 24-38 1Z" : "M76 293q18-12 36-3"} fill={lost ? "#fffef9" : "none"} stroke={lost ? "#20221f" : "#fff"} />
          <path d="m63 256-2-12 9 9m33-5 7-9 1 15" />
        </g>
        {won && <g className="hangman-victory-stars" stroke="#b78750" strokeWidth="3"><path d="m65 80 4 9 10 2-9 5-2 10-5-9-10-1 9-6Zm225 70 3 7 8 1-7 4-1 8-4-7-8-1 7-4Z" /></g>}
      </svg>
      {won && <div className="hangman-confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--piece": i, left: `${8 + (i * 19) % 84}%`, backgroundColor: BALLOONS[i % BALLOONS.length].color } as CSSProperties} />)}
      </div>}
    </div>
  );
}
