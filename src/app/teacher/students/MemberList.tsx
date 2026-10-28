"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeStudent } from "@/lib/class-actions";
import type { ClassMember } from "@/lib/types";

/** The class's students with a button to take each one out. */
export function MemberList({ members }: { members: ClassMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <p className="mt-4 rounded-card border-2 border-dashed border-line px-5 py-6 text-center text-sm font-semibold text-ink-muted">
        Ангид сурагч алга. Баруун талын хэсгээс нэмээрэй.
      </p>
    );
  }

  function remove(member: ClassMember) {
    if (!window.confirm(`${member.username}-г ангиас хасах уу?`)) return;
    startTransition(async () => {
      if (await removeStudent(member.id)) router.refresh();
    });
  }

  return (
    <ul className="mt-4 divide-y divide-line border-y border-line">
      {members.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-bold">{m.username}</p>
            {m.contact && <p className="truncate text-sm text-ink-muted">{m.contact}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(m)}
            disabled={pending}
            className="min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-bold text-magenta hover:bg-pink disabled:opacity-50"
          >
            Хасах
          </button>
        </li>
      ))}
    </ul>
  );
}
