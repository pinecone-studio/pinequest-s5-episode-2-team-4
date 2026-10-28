"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { buttonClass } from "@/components/ui";
import { demoLogIn, logIn } from "@/lib/actions";
import type { PetStage } from "@/lib/types";
import { ArrowIcon, ClassCodeField, PasswordField, TextField } from "../_components/fields";
import { FormError } from "../_components/FormError";
import { PetAvatar } from "../_components/PetAvatar";
import { type Role, RoleToggle } from "../_components/RoleToggle";

export function LoginForm({ pet }: { pet: PetStage }) {
  const [role, setRole] = useState<Role>("student");
  const [showCode, setShowCode] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const [pending, startTransition] = useTransition();
  const isStudent = role === "student";
  const unknownProps = {
    "aria-invalid": unknown,
    "aria-describedby": unknown ? "login-error" : undefined,
    onChange: () => setUnknown(false),
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await logIn({
        username: String(form.get("username") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role,
        classCode: String(form.get("classCode") ?? ""),
      });
      setUnknown(result?.error === "unknown");
    });
  }

  return (
    <section
      aria-labelledby="login-title"
      className="relative w-full max-w-115 rounded-panel bg-white px-6 pt-18 pb-8 shadow-float md:px-10 md:pb-9"
    >
      <PetAvatar className="absolute -top-18 left-1/2 size-36 -translate-x-1/2">
        <PetSprite stage={pet} size={128} className="animate-bob" />
      </PetAvatar>

      <h1 id="login-title" className="text-center text-[32px] leading-tight font-bold">
        Нэвтрэх
      </h1>
      <RoleToggle value={role} onChange={setRole} className="mt-6" />

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <TextField
          id="login-user"
          name="username"
          label="Нэвтрэх нэр"
          type="text"
          autoComplete="username"
          required
          {...unknownProps}
        />
        <TextField
          id="login-mail"
          name="email"
          label="Имэйл"
          type="email"
          autoComplete="email"
          required
          {...unknownProps}
        />
        <PasswordField
          id="login-pass"
          name="password"
          label="Нууц үг"
          autoComplete="current-password"
          required
          {...unknownProps}
        />
        {isStudent &&
          (showCode ? (
            <ClassCodeField id="login-code" name="classCode" label="Ангийн код" autoFocus />
          ) : (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-full border-2 border-dashed border-line bg-white px-3.5 text-sm font-bold text-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ангийн код
            </button>
          ))}
        {unknown && (
          <FormError id="login-error">
            Нэвтрэх нэр, имэйл эсвэл нууц үг буруу байна.{" "}
            <Link href="/signup" className="font-bold">
              Бүртгүүлэх
            </Link>
          </FormError>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={buttonClass({ size: "lg", className: "mt-2 w-full" })}
        >
          Нэвтрэх
          {ArrowIcon}
        </button>
      </form>

      {/* Its own form: forms can't be nested. Always a fresh demo student. */}
      <form action={demoLogIn} className="mt-3">
        <button
          type="submit"
          className={buttonClass({ variant: "secondary", className: "w-full" })}
        >
          Демо нэвтрэх
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm font-semibold">
        {/* TODO: password reset needs a backend */}
        <a href="#" className="inline-flex min-h-11 items-center text-ink-muted">
          Нууц үг мартсан?
        </a>
        <Link href="/signup" className="inline-flex min-h-11 items-center font-bold">
          Бүртгүүлэх
        </Link>
      </div>
    </section>
  );
}
