"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ElementBadge } from "@/components/pet/ElementBadge";
import { PetSprite } from "@/components/pet/PetSprite";
import { buttonClass, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PetLine } from "@/lib/types";
import { PetAvatar } from "../_components/PetAvatar";
import { ArrowIcon, ClassCodeField, PasswordField, TextField } from "../_components/fields";
import { type Role, RoleToggle } from "../_components/RoleToggle";

export function SignupForm({ petLines }: { petLines: PetLine[] }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [petId, setPetId] = useState("wrougon");
  const pet = petLines.find((l) => l.id === petId) ?? petLines[0];
  const isStudent = role === "student";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: no backend yet; the mock user is fixed, so just go on.
    router.push(isStudent ? "/" : "/teacher");
  }

  return (
    <>
      <RoleToggle
        value={role}
        onChange={setRole}
        variant="floating"
        className="mx-auto mt-4 max-w-90 md:mt-5"
      />

      <div
        className={cn(
          "mt-6 grid items-start justify-center gap-6 md:mt-9 md:gap-8",
          isStudent ? "lg:grid-cols-[minmax(0,1fr)_460px]" : "lg:grid-cols-[460px]",
        )}
      >
        {isStudent && (
          <Card>
            <h2 id="pick-title" className="text-xl leading-tight font-bold md:text-2xl">
              Тэжээвэрээ сонго
            </h2>
            <div className="mt-4 flex h-52 items-center justify-center md:h-62">
              <PetAvatar className="size-44 md:size-54">
                <PetSprite stage={pet.stages[0]} size={160} className="animate-bob md:hidden" />
                <PetSprite stage={pet.stages[0]} size={192} className="hidden animate-bob md:block" />
              </PetAvatar>
            </div>
            <p aria-live="polite" className="mt-4 flex items-center justify-center gap-3">
              <span className="text-[28px] leading-tight font-bold">{pet.stages[0].name}</span>
              <ElementBadge element={pet.element} />
            </p>
            <div
              role="group"
              aria-labelledby="pick-title"
              className="mt-6 grid grid-cols-4 gap-2.5 md:grid-cols-6 md:gap-3"
            >
              {petLines.map((line) => {
                const on = line.id === pet.id;
                return (
                  <button
                    key={line.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={line.stages[0].name}
                    onClick={() => setPetId(line.id)}
                    className={cn(
                      "relative flex h-21 cursor-pointer items-center justify-center rounded-card border-3 transition-transform hover:-translate-y-0.75 active:translate-y-0.5",
                      on
                        ? "border-primary bg-white shadow-[0_5px_0_var(--color-primary-dark)]"
                        : "border-surface bg-surface",
                    )}
                  >
                    <PetSprite stage={line.stages[0]} />
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-2.25 -right-2.25 flex size-7 items-center justify-center rounded-full border-3 border-white bg-primary text-white"
                      >
                        <svg viewBox="0 0 24 24" className="size-3.5">
                          <path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <section
          aria-label="Бүртгэл"
          className={cn(
            "relative rounded-panel bg-white px-6 pb-8 shadow-float md:px-9",
            isStudent ? "pt-6 md:pt-8" : "mt-19 pt-21",
          )}
        >
          {!isStudent && (
            <PetAvatar className="absolute -top-18 left-1/2 size-36 -translate-x-1/2">
              <PetSprite stage={pet.stages[0]} size={128} className="animate-bob" />
            </PetAvatar>
          )}
          <form onSubmit={submit} className="flex flex-col gap-4">
            {isStudent ? (
              <TextField id="su-user" label="Нэвтрэх нэр" type="text" autoComplete="username" required />
            ) : (
              <TextField id="su-mail" label="Имэйл" type="email" autoComplete="email" required />
            )}
            <PasswordField id="su-pass" label="Нууц үг" autoComplete="new-password" required />
            {isStudent && <ClassCodeField id="su-code" label="Ангийн код" hint="заавал биш" />}
            <button
              type="submit"
              className={buttonClass({ size: "lg", className: "mt-2 w-full" })}
            >
              {isStudent ? "Эхлэх" : "Бүртгүүлэх"}
              {ArrowIcon}
            </button>
          </form>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-muted">
            Бүртгэлтэй юу?
            <Link href="/login" className="inline-flex min-h-11 items-center px-1 font-bold">
              Нэвтрэх
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
