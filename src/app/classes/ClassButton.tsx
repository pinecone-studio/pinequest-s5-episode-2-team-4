"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * A class card's button. Opening a class loads the whole dashboard before the
 * page changes, which can take a few seconds, so the card shows it's opening.
 */
export function ClassButton({ name, detail }: { name: string; detail: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "flex h-full min-h-36 w-full cursor-pointer flex-col items-start justify-between gap-4 rounded-panel bg-card p-6 text-left shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-float",
        pending && "cursor-wait ring-2 ring-primary hover:translate-y-0",
      )}
    >
      <span className="text-5xl leading-none font-bold tracking-tight">{name}</span>
      <span className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-ink-muted">
        <span>{pending ? "Нээж байна…" : detail}</span>
        {pending ? (
          <span aria-hidden="true" className="size-5 shrink-0 animate-spin rounded-full border-3 border-lavender border-t-primary" />
        ) : (
          <span aria-hidden="true" className="text-lg text-primary">
            →
          </span>
        )}
      </span>
    </button>
  );
}
