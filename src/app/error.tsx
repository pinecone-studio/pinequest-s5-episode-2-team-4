"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold md:text-[32px]">Алдаа гарлаа</h1>
      <p className="max-w-100 text-ink-muted">
        Уучлаарай, ямар нэг зүйл буруу боллоо. Дахин оролдоно уу.
      </p>
      <div className="flex flex-col gap-3 md:flex-row">
        <Button onClick={() => retry()}>Дахин оролдох</Button>
        <ButtonLink href="/" variant="secondary">
          Нүүр рүү буцах
        </ButtonLink>
      </div>
    </main>
  );
}
