/** A small count on a menu link, e.g. new lesson videos. Nothing at 0. */
export function NavBadge({ count, label, className }: { count: number; label: string; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={label}
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-magenta px-1.5 text-xs leading-none font-bold text-white ${className ?? ""}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
