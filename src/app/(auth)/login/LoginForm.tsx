"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { buttonClass } from "@/components/ui";
import type { PetStage } from "@/lib/types";
import { ArrowIcon, ClassCodeField, PasswordField, TextField } from "../_components/fields";
import { PetAvatar } from "../_components/PetAvatar";
import { type Role, RoleToggle } from "../_components/RoleToggle";

export function LoginForm({ pet }: { pet: PetStage }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [showCode, setShowCode] = useState(false);
  const isStudent = role === "student";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: no backend yet; the mock user is fixed, so just go on.
    router.push(isStudent ? "/" : "/teacher");
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
          label="Нэвтрэх нэр"
          type="text"
          autoComplete="username"
          required
        />
        <PasswordField
          id="login-pass"
          label="Нууц үг"
          autoComplete="current-password"
          required
        />
        {isStudent &&
          (showCode ? (
            <ClassCodeField id="login-code" label="Ангийн код" autoFocus />
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
        <button type="submit" className={buttonClass({ size: "lg", className: "mt-2 w-full" })}>
          Нэвтрэх
          {ArrowIcon}
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
