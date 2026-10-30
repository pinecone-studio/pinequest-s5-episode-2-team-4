"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { classNews } from "@/lib/news-actions";

/** How often the class is checked while the page is open. */
const EVERY_MS = 8_000;
/** How long a notification stays unless closed. */
const TOAST_MS = 15_000;

type News = { key: string; kind: "video" | "assignment"; title: string; href: string };

/**
 * Notices a lesson video or assignment the teacher sends while the student
 * has the app open, and says so at the top of the screen ("Багш хичээл
 * орууллаа") with a link to it; the page refreshes so the menu badges count
 * it. What was there when the app opened isn't announced.
 */
export function ClassNewsWatcher() {
  const router = useRouter();
  /** Ids already there (or announced); undefined until the first check. */
  const known = useRef<Set<string>>(undefined);
  const [toasts, setToasts] = useState<News[]>([]);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (document.hidden) return;
      const news = await classNews().catch(() => undefined);
      if (!news || stopped) return;
      const all: News[] = [
        ...news.videos.map((v) => ({ key: `v:${v.id}`, kind: "video" as const, title: v.title, href: `/videos/${v.id}` })),
        ...news.assignments.map((a) => ({ key: `a:${a.id}`, kind: "assignment" as const, title: a.title, href: "/assignments" })),
      ];
      if (!known.current) {
        known.current = new Set(all.map((n) => n.key));
        return;
      }
      const fresh = all.filter((n) => !known.current!.has(n.key));
      if (!fresh.length) return;
      for (const n of fresh) known.current.add(n.key);
      setToasts((list) => [...fresh, ...list].slice(0, 3));
      router.refresh();
    };
    void check();
    const timer = setInterval(check, EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [router]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((list) => list.slice(0, -1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  const close = (key: string) => setToasts((list) => list.filter((t) => t.key !== key));

  return (
    // Top of the screen, like a phone notification.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.key}
          className="pointer-events-auto flex w-full max-w-md animate-word items-center gap-3 rounded-card bg-night px-4 py-3 text-white shadow-float"
        >
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary">
            <PixelIcon name={t.kind === "video" ? "video" : "task"} className="size-6" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-semibold text-white/75">
              {t.kind === "video" ? "Багш хичээл орууллаа" : "Багш даалгавар илгээлээ"}
            </span>
            <span className="truncate font-bold">{t.title}</span>
          </span>
          <Link
            href={t.href}
            onClick={() => close(t.key)}
            className="shrink-0 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-ink no-underline hover:bg-lavender hover:text-ink"
          >
            {t.kind === "video" ? "Үзэх" : "Хийх"}
          </Link>
          <button
            type="button"
            aria-label="Хаах"
            onClick={() => close(t.key)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
