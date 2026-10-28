"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { joinClass } from "@/lib/class-actions";

const ERRORS = {
  expired: "Урилгын хугацаа дууссан байна. Багшаасаа QR-ээ дахин харуулахыг хүсээрэй.",
  failed: "Нэгдэж чадсангүй. Дахин оролдоорой.",
};

export function JoinButton({ token }: { token: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await joinClass(token);
            if (result) setError(ERRORS[result.error]);
          })
        }
        className={buttonClass({ size: "lg", className: "mt-8 w-full max-w-80" })}
      >
        Нэгдэх
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-magenta">
          {error}
        </p>
      )}
    </>
  );
}
