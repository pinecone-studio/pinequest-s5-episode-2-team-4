import "./games.css";
import { SoundToggle } from "./SoundToggle";

type GameShellProps = {
  title: string;
  score: number;
  soundOn: boolean;
  onToggleSound: () => void;
  /** Subject picker, progress and so on, between the top bar and the field. */
  controls: React.ReactNode;
  children: React.ReactNode;
};

/** Dark frame every game shares: title, score and sound on top, then the controls and the play field. */
export function GameShell({ title, score, soundOn, onToggleSound, controls, children }: GameShellProps) {
  return (
    <div className="game-panel mx-auto flex w-full max-w-[460px] flex-col gap-3 rounded-[28px] p-4 md:p-5">
      <div className="flex items-center gap-2.5">
        <h1 className="flex-1 text-xl font-bold">{title}</h1>
        <p className="game-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold tabular-nums" aria-label={`Оноо ${score}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-[var(--game-gold)]">
            <path d="m12 2 3 7 7 .6-5.4 4.6L18 21l-6-3.7L6 21l1.4-6.8L2 9.6 9 9z" />
          </svg>
          {score}
        </p>
        <SoundToggle on={soundOn} onToggle={onToggleSound} />
      </div>
      {controls}
      {children}
    </div>
  );
}
