"use client";

import { useState, useTransition } from "react";
import { PixelIcon, type PixelIconName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { sendSignal, type SignalResult } from "@/lib/signal-actions";
import type { SignalLevel } from "@/lib/types";

const options: { level: SignalLevel; icon: PixelIconName; label: string }[] = [
  { level: "got", icon: "signal-got", label: "Ойлгосон" },
  { level: "unsure", icon: "signal-unsure", label: "Сайн мэдэхгүй" },
  { level: "lost", icon: "signal-lost", label: "Ойлгосонгүй" },
];

const errors: Record<Exclude<SignalResult, { ok: true }>["error"], string> = {
  noclass: "Ангид бүртгэлгүй тул багшид илгээгдсэнгүй. Багшдаа хэлж ангидаа бүртгүүлээрэй.",
  failed: "Илгээж чадсангүй. Дахин дарж үзээрэй.",
};

type SignalCheckProps = {
  subtopicId: string;
  /** The signal the student already sent for this lesson today */
  initial?: SignalLevel;
};

/**
 * «Ойлгосон уу?»: the student sends 🟢🟡🔴 to the teacher anonymously,
 * so nobody has to raise a hand. Sending again today replaces the first one.
 */
export function SignalCheck({ subtopicId, initial }: SignalCheckProps) {
  const [sent, setSent] = useState<SignalLevel | undefined>(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function send(level: SignalLevel) {
    const previous = sent;
    setSent(level);
    setError(undefined);
    startTransition(async () => {
      const result = await sendSignal(subtopicId, level);
      if ("error" in result) {
        setSent(previous);
        setError(errors[result.error]);
      }
    });
  }

  return (
    <section
      aria-labelledby="signal-title"
      className="flex flex-col gap-3 rounded-[25px] bg-surface p-4 md:flex-row md:items-center md:gap-6 md:rounded-panel md:px-8 md:py-5"
    >
      <div className="md:flex-1">
        <h3 id="signal-title" className="text-lg font-bold md:text-xl">
          Ойлгосон уу?
        </h3>
        <p role="status" className={cn("text-sm font-bold", error ? "text-magenta" : "text-ink-muted")}>
          {error ??
            (sent
              ? "Багшид нэргүйгээр илгээгдлээ. Хүссэн үедээ солиж болно."
              : "Нэргүй. Багш зөвхөн ангийн дүнг харна.")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
        {options.map((o) => (
          <button
            key={o.level}
            type="button"
            aria-pressed={sent === o.level}
            disabled={pending}
            onClick={() => send(o.level)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-card border-2 bg-white px-2 py-2.5 text-xs font-bold transition-colors disabled:cursor-wait md:flex-row md:gap-2 md:px-4 md:text-sm",
              sent === o.level
                ? "border-primary text-primary"
                : "border-line hover:border-primary",
            )}
          >
            <PixelIcon name={o.icon} className="size-6 md:size-5" />
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
