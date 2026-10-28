"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markVideoSeen } from "@/lib/video-actions";

/** Marks the video as watched once it's open, then refreshes the menu badge. */
export function MarkSeen({ videoId }: { videoId: string }) {
  const router = useRouter();
  useEffect(() => {
    markVideoSeen(videoId).then(() => router.refresh());
  }, [videoId, router]);
  return null;
}
