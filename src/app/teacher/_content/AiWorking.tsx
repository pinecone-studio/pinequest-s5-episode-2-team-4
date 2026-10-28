"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type AiWorkingProps = {
  /** The steps so far; the last one is running, the others are done. */
  steps: string[];
  /** Lines about what the AI is doing now, shown one after another. */
  activity: string[];
  /** The teacher's files and text, shown being scanned. */
  files?: File[];
  text?: string;
  /** Typical wait, e.g. "10–30 секунд". */
  expected?: string;
};

const ACTIVITY_MS = 3500;

// One preview URL per file for the page's lifetime: a teacher adds a few
// files, and revoking in an effect breaks under React's double mount.
const urls = new WeakMap<File, string>();
function previewUrl(file: File) {
  let url = urls.get(file);
  if (!url) urls.set(file, (url = URL.createObjectURL(file)));
  return url;
}

/**
 * Shows that the AI is working: the material being scanned, the steps
 * done and running, what it's doing now and how long it's taken.
 */
export function AiWorking({ steps, activity, files = [], text, expected }: AiWorkingProps) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  // A new step starts its activity lines from the first one.
  const [stepStart, setStepStart] = useState({ step: steps.length, at: 0 });
  if (stepStart.step !== steps.length) setStepStart({ step: steps.length, at: seconds });
  // The activity line moves on every few seconds and stays on the last one.
  const index = Math.floor(((seconds - stepStart.at) * 1000) / ACTIVITY_MS);
  const line = activity[Math.min(activity.length - 1, index)];

  const previews = files.map((f) => ({
    name: f.name,
    kind: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : "text",
    url: f.type.startsWith("image/") ? previewUrl(f) : undefined,
  }));

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 rounded-card border-2 border-primary/25 bg-surface p-4 md:p-5">
      {(previews.length > 0 || text) && (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-hidden="true">
          {previews.map((p, i) => (
            <div key={`${i}-${p.name}`} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-tile bg-white shadow-card md:h-44 md:w-34">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local preview of the teacher's own file
                <img src={p.url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <span className="text-3xl">{p.kind === "pdf" ? "📄" : "📝"}</span>
                  <span className="line-clamp-2 text-xs font-bold break-all">{p.name}</span>
                </div>
              )}
              <ScanLine />
            </div>
          ))}
          {text && (
            <div className="relative h-36 w-44 shrink-0 overflow-hidden rounded-tile bg-white p-3 shadow-card md:h-44 md:w-56">
              <p className="line-clamp-6 text-xs leading-relaxed text-ink-muted">{text}</p>
              <ScanLine />
            </div>
          )}
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const running = i === steps.length - 1;
          return (
            <li key={step} className={cn("flex items-center gap-2.5 font-bold", !running && "text-ink-muted")}>
              {running ? (
                <span className="size-5 shrink-0 animate-spin rounded-full border-3 border-lavender border-t-primary" />
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky text-xs text-ink">✓</span>
              )}
              {step}
              <span className="sr-only">{running ? " (явагдаж байна)" : " (дууссан)"}</span>
            </li>
          );
        })}
      </ol>

      <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span key={line} className="ai-step-text font-semibold text-primary">
          ✦ {line}
        </span>
        <span className="text-ink-muted tabular-nums">
          {seconds} сек{expected ? ` · ихэвчлэн ${expected}` : ""}
        </span>
      </p>
    </div>
  );
}

function ScanLine() {
  return (
    <>
      <span className="absolute inset-0 bg-primary/5" />
      <span className="ai-scan-line absolute inset-x-0 h-8 bg-linear-to-b from-transparent via-primary/35 to-transparent motion-reduce:hidden" />
    </>
  );
}
