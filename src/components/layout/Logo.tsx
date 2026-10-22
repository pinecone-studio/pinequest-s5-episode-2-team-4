type LogoProps = {
  /** "light" is for dark backgrounds (footer). */
  tone?: "dark" | "light";
  size?: "md" | "sm";
};

export function LogoMark({
  tone = "dark",
  className,
}: {
  tone?: LogoProps["tone"];
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M2 30V22h9v-8h9V6h10v24z"
        className={tone === "light" ? "fill-lavender" : "fill-primary"}
      />
      <rect x="4" y="15" width="5" height="5" rx="1" className="fill-magenta" />
    </svg>
  );
}

export function Logo({ tone = "dark", size = "md" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight ${
        tone === "light" ? "text-white" : "text-ink"
      } ${size === "md" ? "gap-2.5 text-[22px] md:text-2xl" : "gap-2 text-[15px]"}`}
    >
      <LogoMark
        tone={tone}
        className={size === "md" ? "size-[30px] md:size-[34px]" : "size-6"}
      />
      LevelUp
    </span>
  );
}
