"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { unpublishAssignmentAction } from "@/lib/teacher-actions";

/** Takes the assignment back to a draft, so students no longer see it. */
export function UnpublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await unpublishAssignmentAction(id);
          router.refresh();
        })
      }
    >
      {pending ? "Буцааж байна…" : "Нийтлэлээс буцаах"}
    </Button>
  );
}
