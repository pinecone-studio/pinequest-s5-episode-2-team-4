"use client";

import { cn } from "@/lib/cn";

export type Role = "student" | "teacher";

const ROLES: { id: Role; label: string }[] = [
  { id: "student", label: "Сурагч" },
  { id: "teacher", label: "Багш" },
];

type RoleToggleProps = {
  value: Role;
  onChange: (role: Role) => void;
  /** "card" sits inside a white card; "floating" sits on the page background. */
  variant?: "card" | "floating";
  className?: string;
};

export function RoleToggle({ value, onChange, variant = "card", className }: RoleToggleProps) {
  return (
    <div
      role="group"
      aria-label="Бүртгэлийн төрөл"
      className={cn(
        "grid grid-cols-2 gap-1.5 rounded-full p-1.5",
        variant === "card" ? "bg-surface" : "bg-white shadow-card",
        className,
      )}
    >
      {ROLES.map((r) => {
        const on = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(r.id)}
            className={cn(
              "min-h-13 cursor-pointer rounded-full font-bold transition-colors",
              on ? "bg-primary text-white" : "text-ink hover:bg-lavender",
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
