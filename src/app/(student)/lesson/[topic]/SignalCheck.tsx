"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { SignalLevel } from "@/lib/types";

const options: { level: SignalLevel; emoji: string; label: string }[] = [
  { level: "got", emoji: "🟢", label: "Ойлгосон" },
  { level: "unsure", emoji: "🟡", label: "Сайн мэдэхгүй" },
  { level: "lost", emoji: "🔴", label: "Ойлгосонгүй" },
];

/**
 * «Ойлгосон уу?»: the student sends 🟢🟡🔴 to the teacher anonymously,
 * so nobody has to raise a hand. Mock: kept in local state only.
 */
export function SignalCheck() {
  const [sent, setSent] = useState<SignalLevel | null>(null);

  return (
    <section
      aria-labelledby="signal-title"
      className="flex flex-col gap-3 rounded-[25px] bg-surface p-4 md:flex-row md:items-center md:gap-6 md:rounded-panel md:px-8 md:py-5"
    >
      <div className="md:flex-1">
        <h3 id="signal-title" className="text-lg font-bold md:text-xl">
          Ойлгосон уу?
        </h3>
        <p role="status" className="text-sm font-bold text-ink-muted">
          {sent
            ? "Багшид нэргүйгээр илгээгдлээ. Хүссэн үедээ солиж болно."
            : "Нэргүй. Багш зөвхөн ангийн дүнг харна."}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
        {options.map((o) => (
          <button
            key={o.level}
            type="button"
            aria-pressed={sent === o.level}
            onClick={() => setSent(o.level)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-card border-2 bg-white px-2 py-2.5 text-xs font-bold transition-colors md:flex-row md:gap-2 md:px-4 md:text-sm",
              sent === o.level
                ? "border-primary text-primary"
                : "border-line hover:border-primary",
            )}
          >
            <span aria-hidden="true" className="text-2xl md:text-xl">
              {o.emoji}
            </span>
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
