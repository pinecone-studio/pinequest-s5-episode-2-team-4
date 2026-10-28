"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { addStudent } from "@/lib/class-actions";
import { cn } from "@/lib/cn";

const ERRORS = {
  empty: "Сурагчийн имэйл эсвэл утасны дугаарыг бичээрэй.",
  notFound: "Ийм имэйл, утастай сурагчийн бүртгэл олдсонгүй. Эхлээд бүртгүүлэхийг хэлээрэй.",
  already: "Энэ сурагч ангид аль хэдийн байна.",
  demo: "Демо горимд сурагч нэмэх боломжгүй.",
  failed: "Нэмж чадсангүй. Дахин оролдоорой.",
};

/** Adds a registered student by the email or phone they signed up with. */
export function AddStudentForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const contact = String(new FormData(form).get("contact") ?? "");
    startTransition(async () => {
      const result = await addStudent(contact);
      if ("added" in result) {
        setMessage({ text: `${result.added} ангид нэмэгдлээ.`, ok: true });
        form.reset();
        router.refresh();
      } else {
        setMessage({ text: ERRORS[result.error], ok: false });
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="add-contact" className="text-sm font-bold">
        Имэйл эсвэл утасны дугаар
      </label>
      <div className="flex gap-2">
        <input
          id="add-contact"
          name="contact"
          required
          disabled={disabled}
          autoComplete="off"
          placeholder="bat@mail.mn эсвэл 9911 2233"
          aria-describedby={message ? "add-message" : undefined}
          className="h-12 min-w-0 flex-1 rounded-tile border-2 border-lavender bg-white px-4 text-base focus:border-primary focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          aria-busy={pending}
          className={buttonClass({ size: "sm" })}
        >
          Нэмэх
        </button>
      </div>
      {message && (
        <p
          id="add-message"
          role="status"
          className={cn("text-sm font-semibold", message.ok ? "text-status-good-ink" : "text-magenta")}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
