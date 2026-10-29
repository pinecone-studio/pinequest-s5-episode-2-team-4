/** A gold pixel coin: E edge, G gold, H highlight, S shade. */
const COIN = [
  "..EEEE..",
  ".EHHGGE.",
  "EHHGGGGE",
  "EHGGGGSE",
  "EGGGGGSE",
  "EGGGGSSE",
  ".EGSSSE.",
  "..EEEE..",
];
const FILL: Record<string, string> = { E: "#b7791f", G: "#f5c542", H: "#fff1a8", S: "#e0a92e" };

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" className={className}>
      {COIN.flatMap((row, y) =>
        [...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={FILL[c]} />)),
      )}
    </svg>
  );
}

/** The student's coins in the header: earned from quests and achievements, spent in the pet shop. */
export function CoinChip({ coins }: { coins: number }) {
  return (
    <span
      title="Зоос"
      className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-surface pr-2.5 pl-1.5 text-sm font-bold text-ink tabular-nums sm:gap-1.5 sm:pr-3 sm:pl-2"
    >
      <CoinIcon className="size-4 sm:size-5" />
      {coins}
      <span className="sr-only">зоос</span>
    </span>
  );
}
