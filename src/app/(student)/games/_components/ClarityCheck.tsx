"use client";

import { useState, useTransition } from "react";
import { PixelIcon, type PixelIconName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { customTopicKey } from "@/lib/lesson-topics";
import { sendSignal } from "@/lib/signal-actions";
import type { SignalLevel } from "@/lib/types";

const OPTIONS: { level: SignalLevel; icon: PixelIconName; label: string }[] = [
  { level: "got", icon: "signal-got", label: "Тийм" },
  { level: "unsure", icon: "signal-unsure", label: "Дунд зэрэг" },
  { level: "lost", icon: "signal-lost", label: "Үгүй" },
];

/** The topic a pitch judge's answer is counted under on the teacher's dashboard. */
const PITCH_TOPIC = "Pitch ойлгомжтой байсан уу";

/**
 * Under an assignment's results: 🟢🟡🔴 to the teacher, anonymously, like
 * «Ойлгосон уу?» in a lesson. Students say whether they understood today's
 * lesson (the assignment's topic); a pitch judge (`guest`) says whether our
 * pitch was clear. It shows on the teacher's «Хичээлийн дохио».
 */
export function ClarityCheck({ topic, guest }: { topic: string; guest: boolean }) {
  const [sent, setSent] = useState<SignalLevel>();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const key = customTopicKey(guest ? PITCH_TOPIC : topic);

  function send(level: SignalLevel) {
    const previous = sent;
    setSent(level);
    setFailed(false);
    startTransition(async () => {
      const result = await sendSignal(key, level).catch(() => ({ error: "failed" as const }));
      if ("error" in result) {
        setSent(previous);
        setFailed(true);
      }
    });
  }

  return (
    <section aria-labelledby="clarity-title" className="game-chip w-full max-w-[420px] rounded-[14px] px-3 py-3">
      <h3 id="clarity-title" className="font-extrabold text-white">
        {guest ? "Өнөөдрийн бидний pitch танд ойлгомжтой байсан уу?" : "Өнөөдрийн хичээлийг ойлгосон уу?"}
      </h3>
      <p role="status" className={cn("mt-0.5 text-xs font-bold", failed ? "text-[var(--game-gold)]" : "text-[var(--game-muted)]")}>
        {failed ? "Илгээж чадсангүй. Дахин дарж үзээрэй." : sent ? "Баярлалаа! Нэргүйгээр илгээгдлээ." : "Нэргүй илгээгдэнэ."}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.level}
            type="button"
            aria-pressed={sent === o.level}
            disabled={pending}
            onClick={() => send(o.level)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-[12px] border-2 px-2 py-2 text-xs font-bold text-white transition-colors disabled:cursor-wait",
              sent === o.level ? "border-white bg-white/15" : "border-white/20 hover:border-white/60",
            )}
          >
            <PixelIcon name={o.icon} className="size-6" />
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
