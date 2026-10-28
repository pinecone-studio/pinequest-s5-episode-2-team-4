"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "h-14 w-full rounded-tile border-2 border-lavender bg-white px-4.5 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none";

type FieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  /** Small note on the right of the label, e.g. "заавал биш" */
  hint?: string;
};

function Label({ id, label, hint }: { id: string; label: string; hint?: string }) {
  return (
    <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-bold">
      {label}
      {hint && <span className="text-[13px] font-medium text-ink-muted">{hint}</span>}
    </label>
  );
}

export function TextField({ id, label, hint, className, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} hint={hint} />
      <input id={id} className={cn(inputClass, className)} {...props} />
    </div>
  );
}

/** The one subject a teacher teaches, picked from chips; sent as `name`. */
export function SubjectPicker({
  name,
  subjects,
}: {
  name: string;
  subjects: { id: string; title: string }[];
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2 text-sm font-bold">
        Заадаг хичээл
        <span className="text-[13px] font-medium text-ink-muted">дараа солих боломжгүй</span>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {subjects.map((s) => (
          <label
            key={s.id}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-tile border-2 border-lavender bg-white px-2 text-center text-sm font-bold transition-colors hover:border-primary has-checked:border-primary has-checked:bg-surface has-focus-visible:ring-2 has-focus-visible:ring-primary"
          >
            <input type="radio" name={name} value={s.id} required className="sr-only" />
            {s.title}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Class code: dashed, tinted, uppercase with wide letter spacing. */
export function ClassCodeField(props: FieldProps) {
  return (
    <TextField
      type="text"
      autoComplete="off"
      placeholder="K7Q2M"
      className="border-dashed border-line bg-surface text-lg font-bold tracking-[0.2em] uppercase"
      {...props}
    />
  );
}

export function PasswordField({ id, label, hint, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} hint={hint} />
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(inputClass, "pr-15")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
          aria-pressed={visible}
          className="absolute top-1 right-1 flex size-12 cursor-pointer items-center justify-center rounded-xl text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5.5"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}

export const ArrowIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-5.5"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
