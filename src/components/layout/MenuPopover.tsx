"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type MenuPopoverProps = {
  /** What the button shows */
  trigger: React.ReactNode;
  /** The button's accessible name */
  label: string;
  /** Classes for the button */
  triggerClassName?: string;
  /** "end": the panel lines up with the button's right edge */
  align?: "start" | "end";
  /** Called each time the panel opens */
  onOpen?: () => void;
  children: React.ReactNode;
  className?: string;
  /** Classes for the panel, e.g. a wider one */
  panelClassName?: string;
};

/**
 * A button that opens a small panel below it. Closes on a click outside, on
 * Escape and when the page changes.
 */
export function MenuPopover({ trigger, label, triggerClassName, align = "start", onOpen, children, className, panelClassName }: MenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  // A new page closes it (adjusting state during render, not in an effect).
  if (open && openedOn !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) onOpen?.();
          setOpenedOn(pathname);
          setOpen(!open);
        }}
        className={cn("cursor-pointer", triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          className={cn(
            "absolute top-full z-30 mt-2 min-w-56 rounded-card border border-line bg-card p-1.5 shadow-float",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** A row in a MenuPopover panel. */
export const menuItemClass =
  "flex min-h-11 w-full whitespace-nowrap cursor-pointer items-center gap-3 rounded-tile px-3 text-left text-sm font-semibold text-ink no-underline hover:bg-surface hover:text-ink";
