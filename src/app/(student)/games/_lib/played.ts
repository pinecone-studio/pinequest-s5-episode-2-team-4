"use client";

import { useEffect, useRef } from "react";
import { recordGamePlayed } from "@/lib/quest-actions";

/** Counts a finished free-play game for today's quests, once each time `finished` turns true. */
export function useGamePlayed(finished: boolean) {
  const sent = useRef(false);
  useEffect(() => {
    if (!finished) {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    // Quests are a bonus: a failed save never interrupts the game.
    recordGamePlayed().catch(() => {});
  }, [finished]);
}
