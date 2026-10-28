"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { requestPasswordReset } from "@/lib/reset-actions";
import { ArrowIcon, TextField } from "../_components/fields";
import { FormError } from "../_components/FormError";

/** Asks for the account's email and sends a reset link to it. */
export function ForgotForm() {
  /** The address a link was sent to, once the form is sent. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    startTransition(async () => {
      try {
        await requestPasswordReset(email);
        setSentTo(email);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <section
      aria-labelledby="forgot-title"
      className="w-full max-w-115 rounded-panel bg-white px-6 py-8 shadow-float md:px-10 md:py-9"
    >
      <h1 id="forgot-title" className="text-center text-[32px] leading-tight font-bold">
        Нууц үг сэргээх
      </h1>
      {sentTo ? (
        <div role="status" className="mt-6 flex flex-col gap-4">
          <p className="rounded-tile bg-surface px-4 py-3 font-semibold">
            Хэрэв <span className="font-bold break-all">{sentTo}</span> хаягаар бүртгэл байвал нууц үг
            шинэчлэх холбоос илгээлээ. Холбоос 30 минут хүчинтэй.
          </p>
          <p className="text-sm text-ink-muted">Имэйл ирэхгүй бол Spam хавтсаа шалгаарай.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <p className="text-ink-muted">
            Бүртгэлтэй имэйлээ оруулаарай. Нууц үгээ шинэчлэх холбоос илгээнэ.
          </p>
          <TextField
            id="forgot-mail"
            name="email"
            label="Имэйл"
            type="email"
            autoComplete="email"
            required
            aria-describedby={failed ? "forgot-error" : undefined}
            onChange={() => setFailed(false)}
          />
          {failed && (
            <FormError id="forgot-error">Имэйл илгээж чадсангүй. Дараа дахин оролдоно уу.</FormError>
          )}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className={buttonClass({ size: "lg", className: "mt-2 w-full" })}
          >
            Холбоос илгээх
            {ArrowIcon}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm font-semibold">
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold">
          Нэвтрэх рүү буцах
        </Link>
      </p>
    </section>
  );
}
