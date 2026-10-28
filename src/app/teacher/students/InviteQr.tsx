"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui";
import { keepInvite, startInvite, stopInvite } from "@/lib/class-actions";

/** How often the open QR is kept alive (the server lets it lapse after 30 s). */
const KEEP_EVERY_MS = 10_000;

type Shown = { token: string; svg: string };

/**
 * "QR кодоор нэмэх": shows a QR for students to scan and join. It works only
 * while shown: the screen keeps it alive, and closing it ends it at once.
 */
export function InviteQr({ classTitle, disabled }: { classTitle: string; disabled: boolean }) {
  const router = useRouter();
  const [shown, setShown] = useState<Shown>();
  const [state, setState] = useState<"idle" | "loading" | "expired" | "failed">("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  /** Set while an invite is open, so leaving the page can end it. */
  const live = useRef(false);

  async function open() {
    setState("loading");
    dialog.current?.showModal();
    const result = await startInvite();
    if ("error" in result) {
      setState("failed");
      return;
    }
    live.current = true;
    setShown({ token: result.token, svg: result.svg });
    setState("idle");
  }

  function close() {
    dialog.current?.close();
  }

  // While shown: keep the invite alive and refresh the list so new students appear.
  useEffect(() => {
    if (!shown) return;
    const timer = setInterval(async () => {
      if (!(await keepInvite(shown.token))) {
        setShown(undefined);
        setState("expired");
      }
      router.refresh();
    }, KEEP_EVERY_MS);
    return () => clearInterval(timer);
  }, [shown, router]);

  // Leaving the page with the QR open also ends the invite.
  useEffect(
    () => () => {
      if (live.current) void stopInvite();
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        className={buttonClass({ variant: "secondary", className: "w-full" })}
      >
        QR кодоор нэмэх
      </button>

      <dialog
        ref={dialog}
        onClose={() => {
          setShown(undefined);
          setState("idle");
          live.current = false;
          void stopInvite();
          router.refresh();
        }}
        aria-labelledby="qr-title"
        className="m-auto w-[min(92vw,520px)] rounded-panel bg-card p-6 text-ink shadow-float backdrop:bg-night/60 md:p-8"
      >
        <h2 id="qr-title" className="type-section-title text-center">
          {classTitle} ангид нэгдэх
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-ink-muted">
          Утасныхаа камераар уншуулаад «Нэгдэх» дээр дарна.
        </p>

        <div className="mx-auto mt-5 flex aspect-square w-full max-w-90 items-center justify-center rounded-card bg-white p-3">
          {shown ? (
            <div
              role="img"
              aria-label={`${classTitle} ангид нэгдэх QR код`}
              className="size-full [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: shown.svg }}
            />
          ) : (
            <p className="px-6 text-center text-sm font-semibold text-ink-muted">
              {state === "loading" && "QR бэлдэж байна…"}
              {state === "expired" && "Урилгын хугацаа дууслаа."}
              {state === "failed" && "QR үүсгэж чадсангүй."}
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-ink-muted">
          QR зөвхөн энэ цонх нээлттэй байх үед ажиллана. Хаавал хүчингүй болно.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {(state === "expired" || state === "failed") && (
            <button type="button" onClick={open} className={buttonClass({ size: "sm" })}>
              Дахин үүсгэх
            </button>
          )}
          <button type="button" onClick={close} className={buttonClass({ variant: "white", size: "sm" })}>
            Хаах
          </button>
        </div>
      </dialog>
    </>
  );
}
