"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-field border-2 border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-primary";

type GroupFormProps = {
  id: string;
  /** rename: one line for the title; answer: a few lines for the class. */
  kind: "rename" | "answer";
  initial?: string;
  pending: boolean;
  /** Shown between the text field and the buttons. */
  children?: ReactNode;
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

/** Inline form under a question group for its new title or the class answer. */
export function GroupForm({ id, kind, initial = "", pending, children, onSubmit, onCancel }: GroupFormProps) {
  const [draft, setDraft] = useState(initial);
  const inputId = `${kind}-${id}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const text = draft.trim();
        if (text) onSubmit(text);
      }}
      className="mt-3 flex flex-col gap-2"
    >
      <label htmlFor={inputId} className="sr-only">
        {kind === "rename" ? "Бүлгийн нэр" : "Ангид хариулт бичих"}
      </label>
      {kind === "rename" ? (
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={120}
          autoFocus
          className={field}
        />
      ) : (
        <textarea
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={1000}
          autoFocus
          placeholder="Нэг хариулт бүх ангид очно…"
          className={cn(field, "resize-none")}
        />
      )}
      {children}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="white" size="sm" onClick={onCancel}>
          Болих
        </Button>
        <Button type="submit" size="sm" disabled={!draft.trim() || pending}>
          {kind === "rename" ? "Хадгалах" : "Бүх ангид илгээх"}
        </Button>
      </div>
    </form>
  );
}
