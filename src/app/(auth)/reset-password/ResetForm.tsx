"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { resetPassword } from "@/lib/reset-actions";
import { ArrowIcon, PasswordField } from "../_components/fields";
import { FormError } from "../_components/FormError";

/** Sets a new password from a reset link, then logs in. */
export function ResetForm({ token }: { token: string }) {
  const [error, setError] = useState<"mismatch" | "expired" | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("mismatch");
      return;
    }
    startTransition(async () => {
      const result = await resetPassword(token, password);
      setError(result?.error ?? null);
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <PasswordField
        id="reset-pass"
        name="password"
        label="Шинэ нууц үг"
        hint="хамгийн багадаа 6 тэмдэгт"
        autoComplete="new-password"
        required
        minLength={6}
        onChange={() => setError(null)}
      />
      <PasswordField
        id="reset-confirm"
        name="confirm"
        label="Нууц үгээ давтах"
        autoComplete="new-password"
        required
        minLength={6}
        aria-invalid={error === "mismatch"}
        aria-describedby={error ? "reset-error" : undefined}
        onChange={() => setError(null)}
      />
      {error === "mismatch" && <FormError id="reset-error">Оруулсан хоёр нууц үг хоорондоо таарахгүй байна.</FormError>}
      {error === "expired" && (
        <FormError id="reset-error">
          Холбоосын хугацаа дууссан эсвэл ашиглагдсан байна.{" "}
          <Link href="/forgot-password" className="font-bold">
            Шинэ холбоос авах
          </Link>
        </FormError>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={buttonClass({ size: "lg", className: "mt-2 w-full" })}
      >
        Шинэ нууц үг хадгалах
        {ArrowIcon}
      </button>
    </form>
  );
}
