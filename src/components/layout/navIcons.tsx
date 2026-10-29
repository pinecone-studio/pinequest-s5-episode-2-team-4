import { cn } from "@/lib/cn";

/** Line icons for the student menus (SiteHeader, MobileNav), sized by `className`. */
function LineIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </LineIcon>
  );
}

export function BookIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </LineIcon>
  );
}

export function VideoIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <rect x="3" y="5" width="13" height="14" rx="2.5" />
      <path d="m16 10 5-3v10l-5-3" />
    </LineIcon>
  );
}

export function TaskIcon({ className }: { className?: string }) {
  return (
    <LineIcon className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="m9 12.5 2 2 4-4" />
    </LineIcon>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}
