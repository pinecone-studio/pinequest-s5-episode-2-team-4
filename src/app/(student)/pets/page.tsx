import type { Metadata } from "next";
import { getCurrentPet, getPetLines } from "@/lib/data";
import { stageIndex } from "@/lib/pets";
import { EvolutionPreview } from "./EvolutionPreview";
import { PetCollection } from "./PetCollection";
import "./pets.css";

export const metadata: Metadata = {
  title: "Тэжээвэр · LevelUp",
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "white",
  strokeWidth: 2.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-3.5 md:size-[18px]",
} as const;

const RULES = [
  {
    short: "Эзэмших бүрт +1",
    long: "Эзэмших бүрт +1 түвшин",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    short: "3, 6-д хувьсана",
    long: "3 ба 6-д хувьсана",
    icon: (
      <svg {...iconProps}>
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    ),
  },
  {
    short: "Үхэхгүй",
    long: "Хэзээ ч үхэхгүй",
    icon: (
      <svg {...iconProps}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
];

export default async function PetsPage() {
  const [pet, lines] = await Promise.all([getCurrentPet(), getPetLines()]);
  const myStage = pet ? stageIndex(pet.level) : undefined;

  return (
    <div className="pets mx-auto max-w-[1280px] px-4 pt-1 md:px-[clamp(16px,4vw,40px)] md:pt-2">
      <section
        aria-labelledby="pets-title"
        className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,420fr)_minmax(0,560fr)] lg:gap-7"
      >
        <h1
          id="pets-title"
          className="text-[40px] leading-none font-bold tracking-[-0.03em] md:text-[64px] lg:self-end"
        >
          Тэжээвэр
        </h1>

        {pet && (
          <EvolutionPreview
            line={pet.line}
            level={pet.level}
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
          />
        )}

        <ul
          aria-label="Дүрэм"
          className="flex flex-wrap gap-2 text-[13px] font-bold md:gap-2.5 md:text-[15px] lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          {RULES.map((rule) => (
            <li
              key={rule.long}
              className="inline-flex items-center gap-2 rounded-full bg-surface py-1.5 pr-3.5 pl-1.5 md:gap-2.5 md:py-2 md:pr-[18px] md:pl-2"
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-primary md:size-9"
              >
                {rule.icon}
              </span>
              <span className="md:hidden">{rule.short}</span>
              <span className="hidden md:inline">{rule.long}</span>
            </li>
          ))}
        </ul>
      </section>

      <PetCollection lines={lines} myLineId={pet?.lineId} myStage={myStage} />
    </div>
  );
}
