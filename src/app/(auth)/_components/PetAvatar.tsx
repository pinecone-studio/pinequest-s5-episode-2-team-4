import { cn } from "@/lib/cn";

/** Round white-bordered frame with a soft gradient for a big pet sprite. */
export function PetAvatar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border-6 border-white bg-[radial-gradient(circle_at_50%_42%,#fff_0%,var(--color-surface)_55%,var(--color-lavender)_100%)] shadow-float",
        className,
      )}
    >
      {children}
    </div>
  );
}
