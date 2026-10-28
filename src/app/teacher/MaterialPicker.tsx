"use client";

import { useState } from "react";
import { PART_LABELS } from "@/lib/answer-material";
import { cn } from "@/lib/cn";

/** What the form sends; the server checks it again. */
export type MaterialDraft =
  | { kind: "lesson"; subtopicId: string; part: "explanation" | "practice" }
  | { kind: "link"; url: string; title: string };

type MaterialPickerProps = {
  id: string;
  /** The group's lesson; its explanation or practice can be attached. */
  subtopicId: string;
  subtopicTitle: string;
  onChange: (material: MaterialDraft | null) => void;
};

const chip = (on: boolean) =>
  cn(
    "min-h-9 cursor-pointer rounded-full border-2 px-3 text-[13px] font-bold",
    on
      ? "border-primary bg-primary text-white"
      : "border-lavender bg-white text-ink hover:bg-lavender",
  );

const field =
  "w-full rounded-field border-2 border-line bg-white px-3.5 py-2 text-[15px] text-ink outline-none placeholder:text-ink-muted focus:border-primary";

type Choice = "none" | "explanation" | "practice" | "link";

/** Optional material for a group answer: this lesson's explanation or practice, or a link. */
export function MaterialPicker({
  id,
  subtopicId,
  subtopicTitle,
  onChange,
}: MaterialPickerProps) {
  const [choice, setChoice] = useState<Choice>("none");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  function pick(next: Choice, link = { url, title }) {
    setChoice(next);
    if (next === "none") onChange(null);
    else if (next === "link")
      onChange(link.url.trim() ? { kind: "link", ...link } : null);
    else onChange({ kind: "lesson", subtopicId, part: next });
  }

  const choices: [Choice, string][] = [
    ["none", "Материалгүй"],
    ["explanation", `${subtopicTitle} · ${PART_LABELS.explanation}`],
    ["practice", `${subtopicTitle} · ${PART_LABELS.practice}`],
    ["link", "Холбоос"],
  ];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-bold text-ink-muted">
        Нэмэлт материал
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {choices.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={choice === value}
            onClick={() => pick(value)}
            className={chip(choice === value)}
          >
            {label}
          </button>
        ))}
      </div>
      {choice === "link" ? (
        <div className="flex flex-col gap-2 md:flex-row">
          <label htmlFor={`url-${id}`} className="sr-only">
            Холбоос
          </label>
          <input
            id={`url-${id}`}
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://…"
            onChange={(e) => {
              setUrl(e.target.value);
              pick("link", { url: e.target.value, title });
            }}
            className={cn(field, "md:flex-[2]")}
          />
          <label htmlFor={`link-title-${id}`} className="sr-only">
            Холбоосын нэр
          </label>
          <input
            id={`link-title-${id}`}
            value={title}
            maxLength={80}
            placeholder="Нэр (заавал биш)"
            onChange={(e) => {
              setTitle(e.target.value);
              pick("link", { url, title: e.target.value });
            }}
            className={cn(field, "md:flex-1")}
          />
        </div>
      ) : null}
    </fieldset>
  );
}
