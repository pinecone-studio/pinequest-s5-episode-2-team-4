import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink } from "@/components/ui";
import type { PetStage } from "@/lib/types";

type RetestCardProps = {
  /** Where "Дахин шалгуулах" goes. */
  href: string;
  petStage?: PetStage;
};

/** "Бэлэн үү?" call to retest the subtopic. */
export function RetestCard({ href, petStage }: RetestCardProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[25px] bg-ink p-5 text-white md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-5 md:rounded-panel md:px-8 md:py-6">
      <div className="flex items-center gap-3 md:gap-4">
        {petStage ? (
          <PetSprite stage={petStage} size={64} className="rounded-card bg-white" />
        ) : null}
        <h3 className="text-2xl leading-tight font-bold md:text-[28px]">
          Бэлэн үү?
        </h3>
      </div>
      <ButtonLink href={href} variant="white" className="w-full md:w-auto">
        Дахин шалгуулах
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-5"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </ButtonLink>
    </div>
  );
}
