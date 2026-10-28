import Link from "next/link";
import { materialHref, materialLabel } from "@/lib/answer-material";
import { cn } from "@/lib/cn";
import type { AnswerMaterial } from "@/lib/types";

type MaterialLinkProps = {
  material: AnswerMaterial;
  className?: string;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "size-4 shrink-0",
} as const;

/** The teacher's material under an answer: a lesson part in the app, or an outside page in a new tab. */
export function MaterialLink({ material, className }: MaterialLinkProps) {
  const classes = cn(
    "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border-2 border-lavender bg-white px-3.5 text-sm font-bold text-ink hover:bg-lavender",
    className,
  );
  const label = <span className="truncate">{materialLabel(material)}</span>;

  if (material.kind === "lesson") {
    return (
      <Link href={materialHref(material)} className={classes}>
        <svg {...iconProps}>
          <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
        </svg>
        {label}
      </Link>
    );
  }
  return (
    <a
      href={materialHref(material)}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      <svg {...iconProps}>
        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
      {label}
      <span className="sr-only">(шинэ цонхонд)</span>
    </a>
  );
}
