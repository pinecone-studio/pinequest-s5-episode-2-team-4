"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Battle screens (student and teacher): the button would cover the pets there. */
const BATTLE_SCREEN = /^\/(pets|teacher)\/battle\/[0-9a-f-]{36}/i;

export function ThemeToggle() {
  const pathname = usePathname();
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    document.documentElement.classList.remove("theme-changing");
  }, []);

  useEffect(() => {
    try {
      document.documentElement.dataset.theme =
        localStorage.getItem("levelup-theme") === "dark" ? "dark" : "light";
    } catch {
      // Keep the current theme when browser storage is unavailable.
    }
  }, []);

  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme;
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      applyTheme();
    } else if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
    } else {
      const root = document.documentElement;
      root.classList.add("theme-changing");
      // Commit the transition rules before changing the colors.
      void root.offsetWidth;
      applyTheme();
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => root.classList.remove("theme-changing"), 350);
    }
    try {
      localStorage.setItem("levelup-theme", theme);
    } catch {
      // Switching still works when browser storage is unavailable.
    }
  }

  // The saved theme still applies there; only the button is left out.
  if (BATTLE_SCREEN.test(pathname)) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Харанхуй / гэрэлтэй горим солих"
      title="Харанхуй / гэрэлтэй горим солих"
      className="theme-toggle fixed right-4 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-50 flex size-12 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-card md:right-6 md:bottom-6"
    >
      <svg className="theme-moon size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
      </svg>
      <svg className="theme-sun size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
    </button>
  );
}
