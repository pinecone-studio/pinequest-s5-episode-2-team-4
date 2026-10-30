"use client";

import { MenuPopover } from "@/components/layout/MenuPopover";
import { cn } from "@/lib/cn";
import type { TeacherNotification } from "@/lib/types";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-4 md:size-[18px]",
} as const;

const KINDS: Record<
  TeacherNotification["kind"],
  { row: string; badge: string; icon: React.ReactNode }
> = {
  failed: {
    row: "bg-pink",
    badge: "bg-magenta text-white",
    icon: (
      <svg {...iconProps} strokeWidth="2.4">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  "common-mistake": {
    row: "bg-surface",
    badge: "bg-primary text-white",
    icon: (
      <svg {...iconProps} strokeWidth="2.2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  mastered: {
    row: "border-2 border-surface",
    badge: "bg-sky text-ink",
    icon: (
      <svg {...iconProps} strokeWidth="2.8">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
};

type NotificationMenuProps = {
  /** With what each one is about: the subtopic title, or «Ижил алдаа» */
  notifications: (TeacherNotification & { context?: string })[];
};

/**
 * The bell in the teacher header: a badge with the notifications that need
 * the teacher (good news like «Эзэмшсэн» isn't counted), and the list in a
 * panel, like the notifications on other sites.
 */
export function NotificationMenu({ notifications }: NotificationMenuProps) {
  const alertCount = notifications.filter((n) => n.kind !== "mastered").length;
  return (
    <MenuPopover
      label={alertCount ? `Мэдэгдэл, ${alertCount} шинэ` : "Мэдэгдэл"}
      align="end"
      // On a phone the panel lines up with the header's right group instead (it's wider than the bell's room).
      className="max-sm:static"
      triggerClassName="relative flex size-11 sm:size-12 items-center justify-center rounded-full text-ink hover:bg-surface"
      panelClassName="w-[min(24rem,calc(100vw-2rem))] p-3"
      trigger={
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {alertCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-magenta px-1 text-xs font-bold text-white ring-2 ring-card"
            >
              {alertCount}
            </span>
          )}
        </>
      }
    >
      <p className="px-1 pb-2 text-base font-bold">Мэдэгдэл</p>
      {notifications.length === 0 ? (
        <p className="px-1 pb-1 text-sm font-semibold text-ink-muted">Шинэ мэдэгдэл алга.</p>
      ) : (
        <ul className="flex max-h-[min(28rem,70vh)] flex-col gap-2 overflow-y-auto">
          {notifications.map((n) => {
            const kind = KINDS[n.kind];
            return (
              <li key={n.id} className={cn("flex min-h-16 items-center gap-2.5 rounded-card p-2.5 md:gap-3 md:px-3", kind.row)}>
                <span
                  aria-hidden="true"
                  className={cn("flex size-9 shrink-0 items-center justify-center rounded-full md:size-10", kind.badge)}
                >
                  {kind.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <b className="text-base">{n.title}</b>
                  <span className="text-sm text-ink-muted">
                    {n.context ? `${n.context} · ` : ""}
                    {n.time}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </MenuPopover>
  );
}
