"use client";

import { useEffect, useState } from "react";

/** Chrome's install event; not in the DOM typings yet. */
type InstallEvent = Event & { prompt: () => Promise<void> };

const DISMISSED = "levelup-install-dismissed";

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Registers the service worker (public/sw.js) in production, and offers to
 * install the app: one tap on Android, a short Add to Home Screen hint on
 * iPhone. Hidden once installed or dismissed.
 */
export function AppInstall() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // In dev the cache would keep serving old code.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {}
    if (standalone() || dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iPhone has no install event: show the hint instead (after mount, so SSR matches).
    const ios = window.setTimeout(() => setIosHint(isIos()), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearTimeout(ios);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
    setInstall(null);
    setIosHint(false);
  }

  if (!install && !iosHint) return null;

  // A slim bar at the top of the page, in the flow, so it never covers a button.
  return (
    <div className="border-b border-line bg-surface px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <span aria-hidden="true">📲</span>
        <p className="min-w-0 flex-1 font-semibold">
          {open && iosHint ? (
            <>
              Safari-ийн <b>Share ⎋</b> товч → <b>«Add to Home Screen»</b>
            </>
          ) : (
            "LevelUp-ыг утсандаа апп болгож суулгаарай"
          )}
        </p>
        <button
          type="button"
          onClick={() =>
            install
              ? install.prompt().then(() => setInstall(null))
              : setOpen((v) => !v)
          }
          className="min-h-9 shrink-0 cursor-pointer rounded-full bg-primary px-3.5 text-[13px] font-bold text-white"
        >
          {install ? "Суулгах" : open ? "Ойлголоо" : "Яаж?"}
        </button>
        <button
          type="button"
          aria-label="Хаах"
          onClick={dismiss}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
