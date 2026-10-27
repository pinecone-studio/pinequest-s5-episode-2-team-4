type SoundToggleProps = {
  on: boolean;
  onToggle: () => void;
};

/** Speaker button; sound starts off because a class may be listening. */
export function SoundToggle({ on, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? "Дуу унтраах" : "Дуу асаах"}
      className="game-chip grid size-10 cursor-pointer place-items-center rounded-xl"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {on ? (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
