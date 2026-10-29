"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Unlocked, checkAchievements } from "@/lib/achievement-actions";
import { CoinIcon } from "./CoinChip";

/** At most one check this often, however fast the student moves between pages. */
const EVERY_MS = 20_000;
/** How long an unlock toast stays. */
const TOAST_MS = 6_000;

/**
 * Checks for newly reached achievements as the student moves between pages
 * (their coins are added then) and shows a toast for each one unlocked; the
 * page refreshes so the header's coins update.
 */
export function AchievementWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const last = useRef(0);
  const [toasts, setToasts] = useState<Unlocked[]>([]);

  useEffect(() => {
    if (Date.now() - last.current < EVERY_MS) return;
    last.current = Date.now();
    checkAchievements()
      .then((unlocked) => {
        if (!unlocked.length) return;
        setToasts((list) => [...list, ...unlocked]);
        router.refresh();
      })
      // Achievements are a bonus: a failed check never gets in the way.
      .catch(() => {});
  }, [pathname, router]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((list) => list.slice(1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    // Above the phone dock and the theme button; bottom right on wide screens.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-24 md:bottom-6 md:items-end"
    >
      {toasts.slice(0, 3).map((t) => (
        <p
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm animate-word items-center gap-3 rounded-card bg-night px-4 py-3 text-white shadow-float"
        >
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl">
            {t.emoji}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-white/75">Амжилт нээгдлээ!</span>
            <span className="truncate font-bold">{t.title}</span>
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold">
            +{t.coins}
            <CoinIcon className="size-4" />
            <span className="sr-only">зоос</span>
          </span>
        </p>
      ))}
    </div>
  );
}
