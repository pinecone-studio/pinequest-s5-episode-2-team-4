"use client";

import { cn } from "@/lib/cn";

type Choice<T> = { value: T; label: string; available: boolean };

type ChoiceChipsProps<T> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  choices: Choice<T>[];
};

/** A single-choice row of pills; unavailable choices show "Тун удахгүй". */
export function ChoiceChips<T extends string | number>({
  label,
  value,
  onChange,
  choices,
}: ChoiceChipsProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const on = c.value === value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={on}
              disabled={!c.available}
              onClick={() => onChange(c.value)}
              title={c.available ? undefined : "Тун удахгүй"}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition-colors",
                on
                  ? "border-primary bg-primary text-white"
                  : "border-lavender bg-white text-ink enabled:cursor-pointer enabled:hover:bg-lavender",
                !c.available && "border-dashed opacity-60",
              )}
            >
              {c.label}
              {!c.available && (
                <span className="text-[11px] font-semibold text-ink-muted">Тун удахгүй</span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
