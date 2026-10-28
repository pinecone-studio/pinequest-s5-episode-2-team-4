"use client";

import { ViewTransition } from "react";
import { cn } from "@/lib/cn";

/**
 * The background behind the current tab. Render it only in the active link
 * (which needs `relative isolate`): on navigation it slides from the old tab
 * to the new one. `name` must be unique among the nav bars on screen;
 * `className` replaces the default lavender pill (e.g. for an underline).
 */
export function NavPill({ name, className = "inset-0 rounded-full bg-lavender" }: { name: string; className?: string }) {
  return (
    <ViewTransition name={name} share="nav-pill" default="none">
      <span aria-hidden="true" className={cn("absolute -z-10", className)} />
    </ViewTransition>
  );
}
