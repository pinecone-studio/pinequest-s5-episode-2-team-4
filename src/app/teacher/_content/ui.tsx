// Small shared pieces for the teacher's video and assignment pages.

import { cn } from "@/lib/cn";
import { TEACHER_SUBJECTS, subjectTitle } from "@/lib/subjects";
import type { LessonVideoStatus } from "@/lib/types";

export const fieldClass =
  "w-full min-w-0 rounded-tile border-2 border-lavender bg-white px-3.5 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none";

export { subjectTitle as subjectLabel } from "@/lib/subjects";

export const VIDEO_STATUS: Record<LessonVideoStatus, { label: string; className: string }> = {
  draft: { label: "Ноорог", className: "border-2 border-dashed border-line" },
  approved: { label: "Зөвшөөрсөн", className: "bg-lavender" },
  published: { label: "Нийтэлсэн", className: "bg-sky" },
};

/** Says whether content came from the AI or is demo data. */
export function SourceBadge({ source }: { source: "ai" | "demo" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-xs font-bold",
        source === "ai" ? "bg-surface text-primary" : "border-2 border-dashed border-magenta bg-pink text-ink",
      )}
    >
      {source === "ai" ? "✦ AI-ийн санал" : "Жишээ өгөгдөл (AI холбогдоогүй)"}
    </span>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-bold">
      {children}
      {hint && <span className="text-xs font-medium text-ink-muted">{hint}</span>}
    </label>
  );
}

/** A numbered step heading for the multi-step teacher pages. */
export function StepTitle({ n, children, done }: { n: number; children: React.ReactNode; done?: boolean }) {
  return (
    <h2 className="flex items-center gap-3 type-section-title">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-base",
          done ? "bg-sky text-ink" : "bg-primary text-white",
        )}
      >
        {done ? "✓" : n}
      </span>
      {children}
    </h2>
  );
}

/**
 * The subject of what the teacher makes: fixed to the subject they teach,
 * or a choice for older accounts made before teachers picked one.
 */
export function SubjectField({
  id,
  value,
  locked,
  onChange,
}: {
  id: string;
  value: string;
  locked: boolean;
  onChange: (subject: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Хичээл</Label>
      {locked ? (
        <output id={id} className={cn(fieldClass, "flex h-12 items-center bg-surface font-bold")}>
          {subjectTitle(value)}
        </output>
      ) : (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldClass, "h-12")}>
          {TEACHER_SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-card border-2 border-magenta bg-pink px-4 py-3 text-sm font-bold">
      {children}
    </p>
  );
}
