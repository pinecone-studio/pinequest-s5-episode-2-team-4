import { cn } from "@/lib/cn";

type CardProps = React.ComponentProps<"div"> & {
  /** "panel" is the white floating card; "surface" is the flat tinted one. */
  variant?: "panel" | "surface";
};

const variants = {
  panel: "rounded-panel bg-white p-6 shadow-card md:px-8 md:pt-7 md:pb-8",
  surface: "rounded-card bg-surface p-4",
};

export function Card({ variant = "panel", className, ...props }: CardProps) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
