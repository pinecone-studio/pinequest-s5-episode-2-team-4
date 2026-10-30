"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { sendLessonSignal, type SignalResult } from "@/lib/signal-actions";
import type { LessonTopic, SignalLevel, TodayLesson } from "@/lib/types";

const OPTIONS: { level: SignalLevel; emoji: string; label: string }[] = [
  { level: "got", emoji: "🟢", label: "Ойлгосон" },
  { level: "unsure", emoji: "🟡", label: "Сайн мэдэхгүй" },
  { level: "lost", emoji: "🔴", label: "Ойлгосонгүй" },
];

const ERRORS: Record<Exclude<SignalResult, { ok: true }>["error"], string> = {
  noclass: "Ангид бүртгэлгүй тул багшид илгээгдсэнгүй.",
  failed: "Илгээж чадсангүй. Дахин дарж үзээрэй.",
};

/** Topics grouped for the <select>, keeping their order. */
function groups(topics: LessonTopic[]) {
  const map = new Map<string, LessonTopic[]>();
  for (const t of topics) map.set(t.group ?? "", [...(map.get(t.group ?? "") ?? []), t]);
  return [...map];
}

/**
 * «Өнөөдрийн хичээл · Ойлгосон уу?» on a lesson day: the day's planned
 * topic, or the student picks it first. Anonymous: the teacher only sees
 * the class's counts. Answering again changes it.
 */
export function LessonCheckCard({ lesson }: { lesson: TodayLesson }) {
  const router = useRouter();
  const [topicKey, setTopicKey] = useState(lesson.topic?.key ?? lesson.answered?.topicKey ?? "");
  const [sent, setSent] = useState(lesson.answered?.level);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const title = lesson.topic?.title ?? lesson.options.find((t) => t.key === topicKey)?.title;

  function send(level: SignalLevel) {
    const before = sent;
    setSent(level);
    setError(undefined);
    startTransition(async () => {
      const result = await sendLessonSignal(topicKey, level);
      if ("error" in result) {
        setSent(before);
        setError(ERRORS[result.error]);
      } else {
        // The menu badge goes away once answered.
        router.refresh();
      }
    });
  }

  return (
    <section
      aria-labelledby="lesson-check-title"
      className="glass-panel my-6 flex flex-col gap-4 rounded-panel border-2 border-primary/30 bg-card p-5 shadow-card md:my-10 md:p-7"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-card bg-lavender text-3xl">
          📚
        </span>
        <div className="min-w-0">
          <h2 id="lesson-check-title" className="text-xl font-bold">
            Өнөөдрийн хичээл{title ? `: ${title}` : ""}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {lesson.topic
              ? "Ангидаа үзсэн сэдвээ ойлгосон уу? Нэргүй, багш зөвхөн ангийн дүнг харна."
              : "Өнөөдөр ангидаа ямар сэдэв үзсэн бэ? Сонгоод ойлгосон эсэхээ хэлээрэй."}
          </p>
        </div>
      </div>

      {!lesson.topic && (
        <select
          aria-label="Өнөөдөр үзсэн сэдэв"
          value={topicKey}
          onChange={(e) => setTopicKey(e.target.value)}
          className="h-12 w-full min-w-0 rounded-tile border-2 border-lavender bg-card px-3 text-base text-ink focus:border-primary focus:outline-none md:max-w-xl"
        >
          <option value="">Сэдвээ сонгоно уу</option>
          {groups(lesson.options).map(([group, list]) =>
            group ? (
              <optgroup key={group} label={group}>
                {list.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
            ) : (
              list.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.title}
                </option>
              ))
            ),
          )}
        </select>
      )}

      <div role="group" aria-label="Ойлгосон уу?" className="grid grid-cols-3 gap-2 md:max-w-xl">
        {OPTIONS.map((o) => (
          <button
            key={o.level}
            type="button"
            aria-pressed={sent === o.level}
            disabled={!topicKey || pending}
            onClick={() => send(o.level)}
            className={cn(
              "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-card border-2 text-sm font-bold disabled:cursor-default disabled:opacity-50",
              sent === o.level ? "border-primary bg-surface" : "border-lavender bg-card hover:border-primary",
            )}
          >
            <span aria-hidden="true" className="text-2xl">
              {o.emoji}
            </span>
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" className={cn("text-sm font-bold", error ? "text-magenta" : "text-ink-muted")}>
        {error ?? (sent ? "Багшид нэргүйгээр илгээгдлээ. Хүссэн үедээ солиж болно." : "")}
      </p>
    </section>
  );
}
