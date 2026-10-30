import { cn } from "@/lib/cn";
import { SKINS } from "./engine/skins";

type SkinPickerProps = {
  stars: number;
  value: string;
  onChange: (id: string) => void;
};

/** The skin as pixel stripes: one hard-edged band per colour. */
const stripes = (colors: string[]) =>
  `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${(i * 100) / colors.length}% ${((i + 1) * 100) / colors.length}%`).join(", ")})`;

/** Snake colours; locked ones show how many stars they need. */
export function SkinPicker({ stars, value, onChange }: SkinPickerProps) {
  return (
    <fieldset className="flex flex-col items-center gap-2">
      <legend className="mb-2 text-2xs font-extrabold tracking-[0.12em] text-[var(--game-muted)] uppercase">Могойгоо сонго</legend>
      <div className="flex gap-2.5">
        {SKINS.map((skin) => {
          const locked = skin.need > stars;
          const colors = [...new Set(skin.bands)];
          return (
            <button
              key={skin.id}
              type="button"
              disabled={locked}
              aria-pressed={skin.id === value}
              aria-label={locked ? `${skin.name}, ${skin.need} од хэрэгтэй` : skin.name}
              onClick={() => onChange(skin.id)}
              className="pixel-frame relative grid size-[50px] cursor-pointer place-items-center bg-[var(--game-panel)] disabled:cursor-not-allowed"
            >
              <span className={cn("size-6", locked && "brightness-50 grayscale")} style={{ background: stripes(colors) }} />
              <em className={cn("absolute inset-x-0 -bottom-[17px] text-2xs font-bold not-italic", locked ? "text-[var(--game-gold)]" : "text-[var(--game-muted)]")}>
                {locked ? `★${skin.need}` : skin.name}
              </em>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
