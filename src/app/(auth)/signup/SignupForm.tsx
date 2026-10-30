"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ElementBadge } from "@/components/pet/ElementBadge";
import { PetSprite } from "@/components/pet/PetSprite";
import { buttonClass, Card } from "@/components/ui";
import { signUp } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { TEACHER_SUBJECTS } from "@/lib/subjects";
import type { PetLine } from "@/lib/types";
import { FormError } from "../_components/FormError";
import { PetAvatar } from "../_components/PetAvatar";
import { ArrowIcon, PasswordField, SubjectPicker, TextField } from "../_components/fields";
import { type Role, RoleToggle } from "../_components/RoleToggle";

/** `petLines`: the pets a new student can pick; the first is picked to start. */
export function SignupForm({ petLines }: { petLines: PetLine[] }) {
  const [role, setRole] = useState<Role>("student");
  const [petId, setPetId] = useState(petLines[0]?.id);
  /** The field whose value another account already has. */
  const [taken, setTaken] = useState<"username" | "email" | "phone" | null>(null);
  /** The phone number isn't one. */
  const [badPhone, setBadPhone] = useState(false);
  const [pending, startTransition] = useTransition();
  const pet = petLines.find((l) => l.id === petId) ?? petLines[0];
  const isStudent = role === "student";
  const takenProps = (field: "username" | "email") => ({
    "aria-invalid": taken === field,
    "aria-describedby": taken === field ? "signup-error" : undefined,
    onChange: () => setTaken(null),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp({
        username: String(form.get("username") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role,
        phone: isStudent ? String(form.get("phone") ?? "") : undefined,
        petLineId: isStudent ? pet.id : undefined,
        subject: isStudent ? undefined : String(form.get("subject") ?? ""),
      });
      const error = result?.error;
      setTaken(error === "taken" ? "username" : error === "emailTaken" ? "email" : error === "phoneTaken" ? "phone" : null);
      setBadPhone(error === "phone");
    });
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
              Тэжээврээ сонгоорой
            </h2>
            <div className="mt-4 flex h-52 items-center justify-center md:h-62">
              <PetAvatar className="size-44 md:size-54">
                <PetSprite stage={pet.stages[0]} size={160} className="animate-bob md:hidden" />
                <PetSprite stage={pet.stages[0]} size={192} className="hidden animate-bob md:block" />
              </PetAvatar>
            </div>
            <p aria-live="polite" className="mt-4 flex items-center justify-center gap-3">
              <span className="text-3xl leading-tight font-bold">{pet.stages[0].name}</span>
              <ElementBadge element={pet.element} />
            </p>
            <div
              role="group"
              aria-labelledby="pick-title"
              className="mt-6 grid grid-cols-4 gap-2.5 md:gap-3"
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
                        ? "border-primary bg-white shadow-pick"
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
            <TextField
              id="su-user"
              name="username"
              label="Нэвтрэх нэр"
              type="text"
              autoComplete="username"
              required
              {...takenProps("username")}
            />
            <TextField
              id="su-mail"
              name="email"
              label="Имэйл"
              type="email"
              autoComplete="email"
              required
              {...takenProps("email")}
            />
            <PasswordField
              id="su-pass"
              name="password"
              label="Нууц үг"
              hint="хамгийн багадаа 6 тэмдэгт"
              autoComplete="new-password"
              required
              minLength={6}
            />
            {isStudent ? (
              <TextField
                id="su-phone"
                name="phone"
                label="Утасны дугаар"
                hint="заавал биш · багш таныг ангид нэмэхэд ашиглана"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9911 2233"
                aria-invalid={taken === "phone" || badPhone}
                aria-describedby={taken === "phone" || badPhone ? "signup-error" : undefined}
                onChange={() => {
                  setTaken(null);
                  setBadPhone(false);
                }}
              />
            ) : (
              <SubjectPicker name="subject" subjects={TEACHER_SUBJECTS} />
            )}
            {taken && (
              <FormError id="signup-error">
                {taken === "email"
                  ? "Энэ имэйл бүртгэлтэй байна."
                  : taken === "phone"
                    ? "Энэ утасны дугаар бүртгэлтэй байна."
                    : "Энэ нэвтрэх нэрийг өөр хэрэглэгч ашиглаж байна."}{" "}
                <Link href="/login" className="font-bold">
                  Нэвтрэх
                </Link>
              </FormError>
            )}
            {badPhone && (
              <FormError id="signup-error">Утасны дугаараа 8 оронтойгоор бичээрэй, жишээ нь 9911 2233.</FormError>
            )}
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className={buttonClass({ size: "lg", className: "mt-2 w-full" })}
            >
              {isStudent ? "Бүртгүүлж эхлэх" : "Бүртгүүлэх"}
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
