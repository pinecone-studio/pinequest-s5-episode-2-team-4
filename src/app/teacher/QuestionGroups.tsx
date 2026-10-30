"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { GroupRow } from "./GroupRow";
import {
  byLesson,
  isAnswered,
  isOffTopic,
  type GroupView,
} from "./question-inbox";

type QuestionGroupsProps = {
  groups: GroupView[];
  className?: string;
};

type Tab = "open" | "answered";

/**
 * Anonymous questions as an inbox: the AI groups them and notes the
 * misconception; the teacher opens a group and answers the whole class once.
 * Off-topic questions wait in their own section at the bottom.
 */
export function QuestionGroups({ groups, className }: QuestionGroupsProps) {
  const [tab, setTab] = useState<Tab>("open");
  const [openId, setOpenId] = useState<string | null>(null);

  const offTopic = groups.filter((g) => isOffTopic(g) && !isAnswered(g));
  const real = groups.filter((g) => !offTopic.includes(g));
  const lists: Record<Tab, GroupView[]> = {
    open: real.filter((g) => !isAnswered(g)),
    answered: real.filter(isAnswered),
  };
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const tabs: [Tab, string][] = [
    ["open", "Хариулаагүй"],
    ["answered", "Хариулсан"],
  ];

  return (
    <section
      aria-labelledby="questions-title"
      className={cn(
        "min-w-0 rounded-[25px] bg-white p-5 shadow-card md:rounded-panel md:p-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="questions-title"
          className="type-section-title"
        >
          Сурагчдын нэргүй асуулт
        </h2>
        <p className="text-sm font-semibold text-ink-muted">
          <PixelIcon name="robot" className="inline-block size-4 align-[-0.15em]" /> Төстэй агуулгатай асуултуудыг бүлэглэн харуулна
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Асуултын төлөв"
        className="mt-4 inline-flex rounded-full bg-surface p-1"
      >
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "min-h-10 cursor-pointer rounded-full px-4 text-sm font-bold",
              tab === value
                ? "bg-white text-ink shadow-card"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {label}{" "}
            <span className="ml-0.5 opacity-70">{lists[value].length}</span>
          </button>
        ))}
      </div>

      {lists[tab].length === 0 ? (
        <p className="mt-5 text-base text-ink-muted">
          {tab === "open" ? (
            <>
              Хариулт хүлээж буй асуулт алга.{" "}
              <PixelIcon name="clap" className="inline-block size-4 align-[-0.15em]" />
            </>
          ) : (
            "Одоогоор хариулсан асуулт алга."
          )}
        </p>
      ) : (
        byLesson(lists[tab]).map(([lesson, items]) => (
          <div key={lesson} className="mt-5">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
              {lesson}
            </h3>
            <ul className="flex flex-col gap-2">
              {items.map((g) => (
                <GroupRow
                  key={g.id}
                  group={g}
                  open={openId === g.id}
                  onToggle={() => toggle(g.id)}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      {tab === "open" && offTopic.length > 0 ? (
        <details className="mt-6 rounded-card border-2 border-dashed border-line px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold">
            <PixelIcon name="warning" className="inline-block size-4 align-[-0.15em]" /> Агуулгыг нягтлах шаардлагатай ({offTopic.length})
            <span className="ml-1 font-semibold text-ink-muted">
              · хичээлийн агуулгатай холбоогүй байж болзошгүй
            </span>
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {offTopic.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                open={openId === g.id}
                onToggle={() => toggle(g.id)}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
