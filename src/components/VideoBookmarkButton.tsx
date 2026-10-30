"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { setVideoBookmark } from "@/lib/bookmark-actions";

export function VideoBookmarkButton({ videoId, saved, compact = false }: { videoId: string; saved: boolean; compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function toggle() {
    setError("");
    startTransition(async () => {
      try {
        const result = await setVideoBookmark(videoId, !saved);
        if ("error" in result) setError(result.error);
      } catch {
        setError("Хадгалж чадсангүй. Дахин оролдоорой.");
      }
    });
  }
  const label = saved ? "Хадгалснаас хасах" : "Хичээл хадгалах";
  return (
    <div className="relative flex w-fit flex-col items-start gap-2">
      <Button onClick={toggle} disabled={pending} variant={saved ? "primary" : "secondary"} size="sm" aria-label={label} aria-pressed={saved} title={label} className={compact ? "min-w-12 px-3" : undefined}>
        <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
        {!compact && (pending ? "Хадгалж байна…" : saved ? "Хадгалсан" : "Хадгалах")}
      </Button>
      {error && <p role="alert" className={compact ? "absolute top-full right-0 z-10 mt-2 w-48 rounded-field border border-line bg-card p-3 text-xs text-ink shadow-card" : "text-sm text-ink-muted"}>{error}</p>}
    </div>
  );
}
