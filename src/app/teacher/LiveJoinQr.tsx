"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui";
import { pollNameQr, showNameQr } from "@/lib/class-actions";
import { cn } from "@/lib/cn";

/** How often the panel keeps its QR alive and checks who joined (the server lets it lapse after 30 s). */
const POLL_MS = 3000;

type Shown = { token: string; url: string; svg: string };

/**
 * A QR people scan to join the open class with only their name (/q/<token>),
 * and their names as they join, the latest first. Made for showing the class
 * on a big screen, e.g. to judges at a pitch while a lesson video is made.
 * It stays valid while some page shows it; it isn't closed on leaving, so
 * the next page shows the same QR.
 */
export function LiveJoinQr({ autoStart = false, className }: { autoStart?: boolean; className?: string }) {
  const [shown, setShown] = useState<Shown>();
  const [names, setNames] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "demo" | "failed">(autoStart ? "loading" : "idle");

  async function open() {
    setState("loading");
    const result = await showNameQr();
    if ("error" in result) {
      setState(result.error);
      return;
    }
    setShown(result);
    setState("idle");
  }

  useEffect(() => {
    // Opens on its own for the demo teacher; the call sets state when it answers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoStart) void open();
  }, [autoStart]);

  useEffect(() => {
    if (!shown) return;
    let stopped = false;
    const poll = async () => {
      const result = await pollNameQr(shown.token);
      if (stopped) return;
      setNames(result.names);
      // Lapsed (e.g. the screen slept): show a fresh QR.
      if (!result.alive) void open();
    };
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [shown]);

  return (
    <section aria-labelledby="live-join-title" className={cn("rounded-panel bg-card p-5 shadow-card md:p-6", className)}>
      <h2 id="live-join-title" className="text-xl font-bold">
        Утсаараа нэгдээрэй
      </h2>
      <p className="mt-1 text-sm font-semibold text-ink-muted">QR-ыг уншуулаад нэрээ бичихэд л болно.</p>

      {shown ? (
        <>
          <div
            role="img"
            aria-label="Ангид нэгдэх QR код"
            className="mx-auto mt-4 aspect-square w-full max-w-64 rounded-card bg-white p-2 [&_svg]:size-full"
            dangerouslySetInnerHTML={{ __html: shown.svg }}
          />
          <p className="mt-2 text-center text-xs font-semibold break-all text-ink-muted">{shown.url}</p>
          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3">
            <h3 className="font-bold">Нэгдсэн</h3>
            <span aria-live="polite" className="text-sm font-bold text-primary">
              {names.length} хүн
            </span>
          </div>
          {names.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-ink-muted">Хүлээж байна…</p>
          ) : (
            <ul className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
              {names.map((name, i) => (
                <li
                  key={name}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-bold",
                    i === 0 ? "animate-word bg-primary text-white" : "bg-surface text-ink",
                  )}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : state === "demo" ? (
        <p className="mt-4 text-sm font-semibold text-ink-muted">Энэ ангид QR гаргах боломжгүй.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={open}
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className={buttonClass({ variant: "secondary", className: "mt-4 w-full" })}
          >
            {state === "loading" ? "QR гаргаж байна…" : "QR харуулах"}
          </button>
          {state === "failed" && (
            <p role="alert" className="mt-2 text-sm font-semibold text-magenta">
              QR гаргаж чадсангүй. Дахин оролдоорой.
            </p>
          )}
        </>
      )}
    </section>
  );
}
