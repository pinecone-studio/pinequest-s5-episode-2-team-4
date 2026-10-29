import { cn } from "@/lib/cn";
import { SKINS } from "./engine/skins";

type SkinPickerProps = {
  stars: number;
  value: string;
  onChange: (id: string) => void;
};

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
              className={cn(
                "game-chip relative grid size-[50px] cursor-pointer place-items-center rounded-[15px] border-2 disabled:cursor-not-allowed",
                skin.id === value && "border-[var(--game-gold)] shadow-[0_0_0_3px_rgb(255_207_90/0.18)]",
              )}
            >
              <span
                className={cn("size-[26px] rounded-full", locked && "brightness-50 grayscale")}
                style={{
                  background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.7), transparent 45%), conic-gradient(${colors.join(",")},${colors[0]})`,
                }}
              />
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
