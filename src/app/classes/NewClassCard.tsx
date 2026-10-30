"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { createTeacherClass } from "@/lib/class-actions";

const ERRORS = {
  name: "Ангийн нэрийг оруулна уу. Жишээ нь: 7А.",
  demo: "Демо горимд анги нэмэх боломжгүй.",
  failed: "Анги нэмж чадсангүй. Дахин оролдоорой.",
};

/** The "+ Анги нэмэх" card: opens to a name field, then creates the class. */
export function NewClassCard({ demo }: { demo: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-line bg-white/70 p-6 text-lg font-bold text-primary transition-colors hover:border-primary hover:bg-surface"
      >
        <span aria-hidden="true" className="text-4xl leading-none">
          +
        </span>
        Анги нэмэх
      </button>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "");
    startTransition(async () => {
      const result = await createTeacherClass(name);
      if (result) setError(ERRORS[result.error]);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-full min-h-36 flex-col justify-between gap-3 rounded-panel border-2 border-primary bg-card p-5"
    >
      <label htmlFor="new-class" className="text-sm font-bold">
        Ангийн нэр
      </label>
      <input
        id="new-class"
        name="name"
        required
        maxLength={5}
        autoFocus
        autoComplete="off"
        placeholder="7А"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "new-class-error" : undefined}
        className="h-12 rounded-tile border-2 border-lavender bg-white px-4 text-lg font-bold uppercase focus:border-primary focus:outline-none"
      />
      {error && (
        <p id="new-class-error" role="alert" className="text-sm font-semibold text-magenta">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || demo}
          aria-busy={pending}
          className={buttonClass({ size: "sm", className: "flex-1" })}
        >
          Нэмэх
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={buttonClass({ variant: "white", size: "sm" })}
        >
          Цуцлах
        </button>
      </div>
      {demo && <p className="text-xs font-semibold text-ink-muted">Демо горимд анги нэмэх боломжгүй.</p>}
    </form>
  );
}
