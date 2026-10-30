"use client";

import { cn } from "@/lib/cn";
import { REEL_BACKGROUNDS } from "@/lib/reel-frame";
import type { ReelLayout } from "@/lib/types";

export type ReelFrame = { layout: ReelLayout; background?: string };

const LAYOUTS: { value: ReelLayout; title: string; note: string; box: string }[] = [
  { value: "vertical", title: "Босоо", note: "9:16 · утсанд", box: "h-12 w-7" },
  { value: "horizontal", title: "Хэвтээ", note: "16:9 · дэлгэц, проектор", box: "h-7 w-12" },
];

const optionClass = (on: boolean) =>
  cn(
    "flex cursor-pointer items-center gap-3 rounded-card border-2 p-3 text-left",
    on ? "border-primary bg-surface" : "border-lavender bg-card hover:border-primary",
  );

/** Before the reel is made: its shape and the looping video behind it. */
export function ReelFrameChooser({ value, onChange }: { value: ReelFrame; onChange: (frame: ReelFrame) => void }) {
  const backgrounds = [{ id: undefined, title: "Энгийн", src: undefined }, ...REEL_BACKGROUNDS];
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Бичлэгийн хэлбэр</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LAYOUTS.map((l) => (
            <label key={l.value} className={optionClass(value.layout === l.value)}>
              <input
                type="radio"
                name="reel-layout"
                checked={value.layout === l.value}
                onChange={() => onChange({ ...value, layout: l.value })}
                className="sr-only"
              />
              <span className="flex size-14 shrink-0 items-center justify-center rounded-tile bg-surface">
                <span className={cn("rounded-[4px] bg-primary", l.box)} />
              </span>
              <span className="flex flex-col">
                <span className="font-bold">{l.title}</span>
                <span className="text-sm text-ink-muted">{l.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Арын видео</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {backgrounds.map((b) => {
            const on = value.background === b.id;
            return (
              <label key={b.id ?? "plain"} className={cn(optionClass(on), "flex-col items-stretch gap-2 p-2")}>
                <input
                  type="radio"
                  name="reel-background"
                  checked={on}
                  onChange={() => onChange({ ...value, background: b.id })}
                  className="sr-only"
                />
                {b.src ? (
                  <video src={b.src} muted loop autoPlay playsInline className="aspect-video w-full rounded-tile object-cover" />
                ) : (
                  <span className="aspect-video w-full rounded-tile bg-linear-to-b from-primary to-primary-dark" />
                )}
                <span className="text-center text-sm font-bold">{b.title}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
