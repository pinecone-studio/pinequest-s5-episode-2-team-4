"use client";

import { useRouter } from "next/navigation";

type SubjectSelectProps = {
  subjects: { id: string; title: string }[];
  value: string;
  /** Page to reload with `?subject=<id>`, e.g. "/games/snake". */
  basePath: string;
};

/** Subject picker; the chosen subject lives in the URL so the page loads its questions. */
export function SubjectSelect({ subjects, value, basePath }: SubjectSelectProps) {
  const router = useRouter();
  return (
    <label className="relative block">
      <span className="sr-only">Хичээл</span>
      <select
        value={value}
        onChange={(e) => router.replace(`${basePath}?subject=${e.target.value}`, { scroll: false })}
        className="game-chip w-full cursor-pointer appearance-none rounded-2xl py-2.5 pr-10 pl-4 font-semibold text-[var(--game-ink)]"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 size-2 -translate-y-[70%] rotate-45 border-r-2 border-b-2 border-[var(--game-muted)]"
      />
    </label>
  );
}
