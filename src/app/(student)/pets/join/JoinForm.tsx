"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { joinGroupBossBattle } from "@/lib/battle-actions";

const ERRORS: Record<string, string> = {
  format: "Нэгдэх код 6 тэмдэгттэй, ангийн код 10 хүртэл тэмдэгттэй.",
  no_code: "Ийм код эсвэл тулаан явагдаж буй анги олдсонгүй.",
  started: "Энэ бүлгийн тулаан аль хэдийн эхэлсэн.",
  full: "Энэ бүлэг дүүрсэн байна (8 хүн).",
};

/** Join a friend's group battle or a class battle: the 6-character code, or the class code. */
export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinGroupBossBattle, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="join-code" className="font-bold">
        Нэгдэх код эсвэл ангийн код
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          id="join-code"
          name="code"
          required
          maxLength={10}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7Q2MX · 7А"
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "join-error" : undefined}
          className="h-14 min-w-0 flex-1 rounded-tile border-2 border-dashed border-line bg-surface px-4 font-mono text-2xl font-bold tracking-[0.3em] uppercase focus:border-primary focus:outline-none"
        />
        <Button type="submit" disabled={pending}>
          Нэгдэх
        </Button>
      </div>
      {state?.error ? (
        <p id="join-error" role="alert" className="rounded-tile border-2 border-magenta bg-pink px-4 py-3 font-semibold">
          {ERRORS[state.error] ?? "Нэгдэж чадсангүй."}
        </p>
      ) : null}
    </form>
  );
}
