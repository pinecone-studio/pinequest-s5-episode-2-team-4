"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CoinIcon } from "@/components/layout/CoinChip";
import { Button, ButtonLink, PixelIcon, type PixelIconName, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { type ClaimResult, claimQuest } from "@/lib/quest-actions";
import type { DailyQuest, QuestEvent } from "@/lib/types";

/** Each activity's icon, tint and where to go to do it. */
const ACTIVITY: Record<QuestEvent, { icon: PixelIconName; tint: string; href: string }> = {
  game: { icon: "gamepad", tint: "bg-tint-blue", href: "/games" },
  practice: { icon: "pencil", tint: "bg-tint-sand", href: "/lesson/fractions" },
  battle: { icon: "swords", tint: "bg-tint-pink", href: "/pets/battle" },
  video: { icon: "clapper", tint: "bg-tint-violet", href: "/videos" },
  assignment: { icon: "clipboard", tint: "bg-tint-periwinkle", href: "/assignments" },
};

const ERRORS: Record<Exclude<ClaimResult, { ok: true }>["error"], string> = {
  notdone: "Энэ зорилт хараахан биелээгүй байна.",
  claimed: "Энэ урамшууллыг аль хэдийн авсан.",
  failed: "Авч чадсангүй. Дахин оролдоорой.",
};

/**
 * «Өдрийн зорилт»: today's three quests with their progress. A finished one
 * is claimed here for its XP and coins; the rest link to where to do them.
 * They start over at midnight (Ulaanbaatar).
 */
export function DailyQuestsCard({ quests }: { quests: DailyQuest[] }) {
  const router = useRouter();
  // Claimed in this visit, shown at once before the page refreshes.
  const [claimed, setClaimed] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const isClaimed = (q: DailyQuest) => q.claimed || claimed.includes(q.id);
  const claimedCount = quests.filter(isClaimed).length;

  function claim(quest: DailyQuest) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await claimQuest(quest.id);
      if ("error" in result) {
        setMessage(ERRORS[result.error]);
        return;
      }
      setClaimed((list) => [...list, quest.id]);
      setMessage(`+${result.xp} XP, +${result.coins} зоос авлаа!`);
      // The header's coins and the pet's XP ring update.
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="quests-title" className="glass-panel my-6 rounded-panel border border-line bg-white p-5 shadow-card md:my-10 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-lavender">
            <PixelIcon name="target" className="size-8" />
          </span>
          <div>
            <h2 id="quests-title" className="text-xl font-bold">
              Өдрийн зорилт
            </h2>
            <p className="text-sm text-ink-muted">Биелүүлээд урамшуулал аваарай. Шөнө дунд шинэчлэгдэнэ.</p>
          </div>
        </div>
        <span className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-bold">
          {claimedCount}/{quests.length} авсан
        </span>
      </div>

      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {quests.map((q) => {
          const activity = ACTIVITY[q.event];
          const taken = isClaimed(q);
          return (
            <li key={q.id} className="flex flex-col gap-3 rounded-card bg-surface p-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", activity.tint)}>
                  <PixelIcon name={activity.icon} className="size-6" />
                </span>
                <h3 className="font-bold">{q.title}</h3>
              </div>
              <ProgressBar value={(q.progress / q.goal) * 100} label={`${q.title}: ${q.progress}/${q.goal}`} size="sm" track="white" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="font-bold tabular-nums">
                    {q.progress}/{q.goal}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-muted">
                    +{q.xp} XP ·
                    <CoinIcon className="size-4" />
                    {q.coins}
                    <span className="sr-only">зоос</span>
                  </span>
                </div>
                {taken ? (
                  <p className="flex min-h-12 items-center gap-1.5 px-2 font-bold text-ink-muted">
                    <span aria-hidden="true">✓</span> Авсан
                  </p>
                ) : q.done ? (
                  <Button size="sm" disabled={pending} onClick={() => claim(q)}>
                    Авах
                  </Button>
                ) : (
                  <ButtonLink href={activity.href} variant="white" size="sm">
                    Эхлэх
                  </ButtonLink>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold empty:hidden">
        {message}
      </p>
    </section>
  );
}
