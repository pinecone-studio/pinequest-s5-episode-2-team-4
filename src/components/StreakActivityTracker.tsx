"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { learningDay } from "@/lib/streak";
import { recordSiteActivity } from "@/lib/streak-actions";

/** No background heartbeat: opening the site, returning, or acting counts. */
export function StreakActivityTracker({ accountId, recordedDay }: { accountId: string; recordedDay?: string }) {
  const router = useRouter();

  useEffect(() => {
    let confirmedDay = recordedDay;
    let inFlight = false;
    let retryAfter = 0;
    let disposed = false;

    async function record() {
      if (disposed || document.visibilityState !== "visible" || inFlight || Date.now() < retryAfter) return;
      const today = learningDay();
      if (confirmedDay && confirmedDay >= today) return;
      inFlight = true;
      try {
        const result = await recordSiteActivity();
        if (!disposed && result) {
          confirmedDay = result.date;
          // Refresh the server-rendered card once, after the daily save.
          router.refresh();
        } else if (!result) {
          retryAfter = Date.now() + 30_000;
        }
      } catch {
        // A later action retries after offline/server failures, without spamming.
        retryAfter = Date.now() + 30_000;
      } finally {
        inFlight = false;
      }
    }

    void record();
    const onActivity = () => { void record(); };
    window.addEventListener("focus", onActivity);
    document.addEventListener("visibilitychange", onActivity);
    document.addEventListener("pointerdown", onActivity, { passive: true });
    document.addEventListener("keydown", onActivity);
    return () => {
      disposed = true;
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
      document.removeEventListener("pointerdown", onActivity);
      document.removeEventListener("keydown", onActivity);
    };
  }, [accountId, recordedDay, router]);

  return null;
}
