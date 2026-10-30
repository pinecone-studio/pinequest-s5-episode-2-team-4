"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { joinByName } from "@/lib/class-actions";
import { FormError } from "../../_components/FormError";
import { TextField } from "../../_components/fields";

const ERRORS = {
  name: "Нэрээ бичнэ үү.",
  expired: "QR-ын хугацаа дууссан байна. Дэлгэц дээрх QR-ыг дахин уншуулаарай.",
  failed: "Нэгдэж чадсангүй. Дахин оролдоорой.",
};

/** Just a name: the account is made for them when they join. */
export function NameJoinForm({ token }: { token: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "");
    startTransition(async () => {
      const result = await joinByName(token, name);
      if (result) setError(ERRORS[result.error]);
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 flex w-full max-w-90 flex-col gap-4 text-left">
      <TextField
        id="join-name"
        name="name"
        label="Таны нэр"
        required
        maxLength={40}
        autoComplete="name"
        autoFocus
        placeholder="Жишээ нь: Бат"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "join-error" : undefined}
      />
      {error && <FormError id="join-error">{error}</FormError>}
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
        {pending ? "Нэгдэж байна…" : "Нэгдэх"}
      </button>
    </form>
  );
}
