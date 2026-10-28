"use client";

import { cn } from "@/lib/cn";
import { checkFormula } from "@/lib/formula";
import type { Recognition } from "@/lib/types";
import { fieldClass } from "./ui";

type RecognitionEditorProps = {
  value: Recognition;
  onChange: (value: Recognition) => void;
  /** The topic was found by the AI, not typed by the teacher. */
  topicDetected?: boolean;
};

function ListSection<T>({
  title,
  items,
  empty,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  items: T[];
  empty: T;
  onAdd: (item: T) => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 rounded-card bg-surface p-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-2">{render(item, i)}</div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`${title}: ${i + 1}-ийг хасах`}
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-lavender"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onAdd(empty)} className="self-start cursor-pointer rounded-full border-2 border-dashed border-line px-4 py-2 text-sm font-bold text-primary hover:bg-surface">
        + Нэмэх
      </button>
    </section>
  );
}

/** What the AI recognised in the material, for the teacher to fix, add to or trim. */
export function RecognitionEditor({ value, onChange, topicDetected }: RecognitionEditorProps) {
  const set = <K extends keyof Recognition>(key: K, v: Recognition[K]) => onChange({ ...value, [key]: v });
  const update = <K extends "concepts" | "examples" | "mistakes">(key: K, i: number, patch: Partial<Recognition[K][number]>) =>
    set(key, value[key].map((item, j) => (j === i ? { ...item, ...patch } : item)) as Recognition[K]);
  const input = (v: string, onValue: (v: string) => void, label: string, extra?: string) => (
    <input aria-label={label} value={v} onChange={(e) => onValue(e.target.value)} className={cn(fieldClass, "h-11 text-base", extra)} />
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rec-topic" className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-bold">
          Сэдэв
          {topicDetected && (
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-primary">
              ✦ AI материалаас таньсан · засаж болно
            </span>
          )}
        </label>
        <input id="rec-topic" value={value.topic} onChange={(e) => set("topic", e.target.value)} className={cn(fieldClass, "h-12 font-bold")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListSection
          title="Гол ойлголт"
          items={value.concepts}
          empty={{ title: "", explanation: "" }}
          onAdd={(c) => set("concepts", [...value.concepts, c])}
          onRemove={(i) => set("concepts", value.concepts.filter((_, j) => j !== i))}
          render={(c, i) => (
            <>
              {input(c.title, (v) => update("concepts", i, { title: v }), "Ойлголт", "font-bold")}
              <textarea aria-label="Тайлбар" value={c.explanation} rows={2} onChange={(e) => update("concepts", i, { explanation: e.target.value })} className={cn(fieldClass, "py-2 text-base")} />
            </>
          )}
        />
        <ListSection
          title="Түгээмэл алдаа"
          items={value.mistakes}
          empty={{ wrong: "", why: "" }}
          onAdd={(m) => set("mistakes", [...value.mistakes, m])}
          onRemove={(i) => set("mistakes", value.mistakes.filter((_, j) => j !== i))}
          render={(m, i) => (
            <>
              {input(m.wrong, (v) => update("mistakes", i, { wrong: v }), "Алдаатай бодолт", "border-magenta/40")}
              {input(m.why, (v) => update("mistakes", i, { why: v }), "Яагаад буруу")}
            </>
          )}
        />
      </div>

      <ListSection
        title="Жишээ бодлого"
        items={value.examples}
        empty={{ problem: "", solution: "", answer: "" }}
        onAdd={(e) => set("examples", [...value.examples, e])}
        onRemove={(i) => set("examples", value.examples.filter((_, j) => j !== i))}
        render={(ex, i) => (
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_8rem]">
            {input(ex.problem, (v) => update("examples", i, { problem: v }), "Бодлого", "font-bold")}
            {input(ex.solution, (v) => update("examples", i, { solution: v }), "Бодолт")}
            {input(ex.answer, (v) => update("examples", i, { answer: v }), "Хариу")}
          </div>
        )}
      />

      <ListSection
        title="Томъёо"
        items={value.formulas}
        empty=""
        onAdd={(f) => set("formulas", [...value.formulas, f])}
        onRemove={(i) => set("formulas", value.formulas.filter((_, j) => j !== i))}
        render={(f, i) => {
          const check = f.includes("=") ? checkFormula(f) : undefined;
          return (
            <div className="flex items-center gap-2">
              {input(f, (v) => set("formulas", value.formulas.map((x, j) => (j === i ? v : x))), "Томъёо", "font-bold")}
              {check?.status === "ok" && <span className="shrink-0 text-sm font-bold text-primary">✓</span>}
              {check?.status === "wrong" && <span className="shrink-0 text-xs font-bold text-magenta">✗ зөв нь {check.expected}</span>}
            </div>
          );
        }}
      />
    </div>
  );
}
