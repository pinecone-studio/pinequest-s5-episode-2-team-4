"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { checkAchievements } from "@/lib/achievement-actions";

/** At most one check this often, however fast the student moves between pages. */
const EVERY_MS = 20_000;

/**
 * Checks for newly reached achievements as the student moves between pages
 * (their coins are added then). Shows nothing; when something unlocks, the
 * page refreshes so the header's coins update.
 */
export function AchievementWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const last = useRef(0);

  useEffect(() => {
    if (Date.now() - last.current < EVERY_MS) return;
    last.current = Date.now();
    checkAchievements()
      .then((unlocked) => {
        if (unlocked.length) router.refresh();
      })
      // Achievements are a bonus: a failed check never gets in the way.
      .catch(() => {});
  }, [pathname, router]);

  return null;
}
