import { cn } from "@/lib/cn";

export type ExplainCardState = {
  kind: "good" | "bad";
  title: string;
  text?: string;
  /** Right answers shown as chips after a round. */
  chips?: string[];
  /** Extra warning line, e.g. when the player seems to be guessing. */
  note?: string;
  /** Seconds before it closes by itself; without it the player taps «Ойлголоо». */
  seconds?: number;
};

type ExplainCardProps = {
  card: ExplainCardState | null;
  onContinue: () => void;
};

/** Card over the bottom of the field: why an answer was wrong, or the round's right answers. */
export function ExplainCard({ card, onContinue }: ExplainCardProps) {
  return (
    <div
      data-open={card ? "true" : "false"}
      aria-live="polite"
      className={cn(
        "game-card absolute inset-x-3.5 bottom-3.5 flex flex-col gap-2 rounded-[18px] border bg-[rgb(21_16_54/0.95)] p-3.5 shadow-[0_20px_40px_-18px_#000]",
        card?.kind === "bad" ? "border-[var(--game-bad)]" : "border-[var(--game-line)]",
      )}
    >
      {card ? (
        <>
          <p className="flex items-center gap-2 font-bold">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[22px] place-items-center rounded-md text-sm text-[var(--game-bg)]",
                card.kind === "bad" ? "bg-[var(--game-bad)]" : "bg-[var(--game-good)]",
              )}
            >
              {card.kind === "bad" ? "!" : "✓"}
            </span>
            {card.title}
          </p>
          {card.text ? <p className="text-[15px] text-[var(--game-muted)]">{card.text}</p> : null}
          {card.note ? <p className="text-sm font-bold text-[var(--game-gold)]">{card.note}</p> : null}
          {card.chips ? (
            <ul className="flex flex-wrap gap-1.5">
              {card.chips.map((c) => (
                <li key={c} className="rounded-full border border-[rgb(52_211_153/0.5)] bg-[rgb(52_211_153/0.18)] px-2.5 py-1 text-sm font-bold">
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
          {card.seconds ? (
            <span className="h-1 overflow-hidden rounded-full bg-white/10">
              <span
                key={card.title + card.text}
                style={{ "--game-timer": `${card.seconds}s` } as React.CSSProperties}
                className="game-timer block h-full bg-[var(--game-muted)]"
              />
            </span>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={onContinue}
              className="game-gradient cursor-pointer self-end rounded-xl px-4 py-2 font-bold text-white"
            >
              Ойлголоо ▸
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}
