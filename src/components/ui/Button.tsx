import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "white";
type Size = "sm" | "md" | "lg";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

// "3D" buttons: a solid offset shadow that collapses when pressed.
const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-3d hover:text-white active:shadow-[0_1px_0_var(--color-primary-dark)]",
  secondary:
    "bg-surface text-ink shadow-3d-soft hover:text-ink active:shadow-[0_1px_0_var(--color-line)]",
  white:
    "bg-card text-ink shadow-3d-soft hover:text-ink active:shadow-[0_1px_0_var(--color-line)]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-12 px-5 text-base",
  md: "min-h-15 px-8 text-lg",
  lg: "min-h-17 px-10 text-2xl",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: StyleProps = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full font-bold no-underline transition-[transform,box-shadow,filter] duration-75 hover:brightness-105 active:translate-y-[5px] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = StyleProps & React.ComponentProps<"button">;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = StyleProps & React.ComponentProps<typeof Link>;

/** A link that looks like a Button. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props} />
  );
}
