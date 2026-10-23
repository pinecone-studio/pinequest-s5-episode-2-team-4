import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink } from "@/components/ui";
import type { PetStage } from "@/lib/types";

const PlayIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
);

// Five pets on the orbit around the hexagon; x/y in px of the 460px orbit.
const ORBIT_SPOTS = [
  { x: 190, y: -40 },
  { x: 409, y: 119 },
  { x: 325, y: 376 },
  { x: 55, y: 376 },
  { x: -29, y: 119 },
];

const hexagon = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";

type HomeHeroProps = {
  pet: { stage: PetStage; level: number };
  /** The main button: start the test, or continue the current lesson. */
  cta: { href: string; label: string };
  orbitPets: PetStage[];
  /** e.g. "7-р анги · Математик · K7Q2M анги" */
  school: string;
};

export function HomeHero({ pet, cta, orbitPets, school }: HomeHeroProps) {
  const words = ["Ойлгоогүйгээ", "ичихгүйгээр"];
  return (
    <section
      aria-labelledby="hero-title"
      className="flex flex-col gap-2 pt-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-10 md:pt-4"
    >
      <div className="contents md:flex md:max-w-135 md:min-w-0 md:flex-[1_1_420px] md:flex-col md:items-start md:gap-10">
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-1.5 text-sm font-bold shadow-card">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          {school}
        </p>
        <h1
          id="hero-title"
          className="px-1 text-[40px] leading-[1.05] font-bold tracking-tight text-balance md:px-0 md:text-6xl"
        >
          {words.map((w, i) => (
            <span key={w}>
              <span className="inline-block animate-word" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                {w}
              </span>{" "}
            </span>
          ))}
          <span className="inline-block animate-word text-primary" style={{ animationDelay: "0.4s" }}>
            нөх.
          </span>
        </h1>
        <ButtonLink
          href={cta.href}
          size="lg"
          className="order-last w-full pr-10 pl-8 md:order-none md:w-auto"
        >
          {PlayIcon}
          {cta.label}
        </ButtonLink>
      </div>

      {/* 540px artwork, scaled to 60% on phones */}
      <div className="mx-auto flex justify-center md:flex-[0_1_540px]">
        <div className="relative size-81 md:size-135">
          <div className="absolute top-0 left-0 size-135 origin-top-left scale-60 md:scale-100">
            <div aria-hidden="true" className="absolute top-10 left-10 size-115 rounded-full border-2 border-dashed border-line" />
            <div aria-hidden="true" className={`absolute top-22.5 left-28.5 h-90 w-78 overflow-hidden bg-primary ${hexagon}`}>
              <div className="absolute -top-19 -left-25 size-128 animate-[spin_14s_linear_infinite] bg-[conic-gradient(from_0deg,var(--color-primary),var(--color-magenta),var(--color-sky),var(--color-lavender),var(--color-primary))]" />
            </div>
            <div className={`absolute top-26 left-31.5 flex h-83 w-72 items-center justify-center bg-[radial-gradient(circle_at_50%_42%,#fff_0%,var(--color-surface)_48%,var(--color-lavender)_100%)] ${hexagon}`}>
              <div aria-hidden="true" className="absolute top-62.5 left-18.5 h-4.5 w-35 rounded-[50%] bg-ink/15" />
              <PetSprite
                stage={pet.stage}
                size={256}
                alt={`${pet.stage.name}, чиний тэжээвэр`}
                className="relative animate-bob"
              />
            </div>
            <p className="absolute top-105 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4.5 py-2 text-[15px] font-bold whitespace-nowrap shadow-float">
              <span>{pet.stage.name}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-line" />
              <span className="text-primary">Түв. {pet.level}</span>
            </p>
            <div aria-hidden="true" className="absolute top-10 left-10 size-115 animate-[spin_60s_linear_infinite]">
              {orbitPets.slice(0, ORBIT_SPOTS.length).map((stage, i) => (
                <div
                  key={stage.name}
                  className="absolute flex size-20 animate-[spin_60s_linear_infinite_reverse] items-center justify-center rounded-full bg-white shadow-card"
                  style={{ left: ORBIT_SPOTS[i].x, top: ORBIT_SPOTS[i].y }}
                >
                  <PetSprite stage={stage} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
