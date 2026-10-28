"use client";

import { useState } from "react";
import { BookView } from "@/components/BookView";
import { cn } from "@/lib/cn";
import type { LessonVideo } from "@/lib/types";
import { ReelPlayer } from "@/remotion/ReelPlayer";
import { estimateTimings } from "@/lib/reel-timing";

/** Watch the reel or read the same lesson as a textbook page. */
export function VideoTabs({ video }: { video: LessonVideo }) {
  const [tab, setTab] = useState<"video" | "book">("video");
  const tabs = [
    { id: "video" as const, label: "Видео" },
    ...(video.book ? [{ id: "book" as const, label: "Номын хэлбэрээр" }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Үзэх хэлбэр" className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full px-5 font-bold",
                tab === t.id ? "bg-primary text-white" : "bg-surface text-ink hover:bg-lavender",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={tabs.length > 1 ? `tab-${tab}` : undefined}>
        {tab === "video" ? (
          <ReelPlayer
            script={video.script}
            timings={video.timings ?? estimateTimings(video.script)}
            audioUrl={video.audioUrl}
            className="mx-auto"
          />
        ) : (
          video.book && <BookView book={video.book} title={video.script.title} />
        )}
      </div>
    </div>
  );
}
