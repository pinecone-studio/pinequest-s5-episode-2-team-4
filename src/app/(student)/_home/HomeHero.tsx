import { ElementRing } from "@/components/pet/ElementRing";
import { PetSprite } from "@/components/pet/PetSprite";
import { ButtonLink } from "@/components/ui";
import type { PetElement, PetStage } from "@/lib/types";

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

type HomeHeroProps = {
  pet: { stage: PetStage; level: number };
  /** Before the diagnostic test the play button starts it. */
  testTaken: boolean;
  orbitPets: { stage: PetStage; element: PetElement }[];
};

export function HomeHero({ pet, testTaken, orbitPets }: HomeHeroProps) {
  const words = ["Ойлгоогүйгээ", "өөрийн", "хурдаар"];
  return (
    <section
      aria-labelledby="hero-title"
      className="flex flex-col gap-2 pt-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-10 md:pt-4"
    >
      <div className="contents md:flex md:max-w-135 md:min-w-0 md:flex-[1_1_420px] md:flex-col md:items-start md:gap-10">
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
          <span className="inline-block animate-word text-primary" style={{ animationDelay: "0.55s" }}>
            нөх.
          </span>
        </h1>
        <ButtonLink
          href="/test"
          size="lg"
          className="order-last w-full pr-10 pl-8 md:order-none md:w-auto"
        >
          {PlayIcon}
          {testTaken ? "Тоглох" : "Тест эхлэх"}
        </ButtonLink>
      </div>

      {/* 540px artwork, scaled to 60% on phones */}
      <div className="mx-auto flex justify-center md:flex-[0_1_540px]">
        <div className="relative size-81 md:size-135">
          <div className="absolute top-0 left-0 size-135 origin-top-left scale-60 md:scale-100">
            {/* Soft aurora glow behind the stage */}
            <div aria-hidden="true" className="absolute top-14 left-12 size-72 animate-[bob_7s_ease-in-out_infinite] rounded-full bg-primary/35 blur-3xl" />
            <div aria-hidden="true" className="absolute top-40 right-8 size-64 animate-[bob_9s_ease-in-out_infinite_reverse] rounded-full bg-magenta/30 blur-3xl" />
            <div aria-hidden="true" className="absolute bottom-6 left-24 size-56 rounded-full bg-sky/60 blur-3xl" />
            <div aria-hidden="true" className="absolute top-10 left-10 size-115 rounded-full border border-primary/15" />
            <div aria-hidden="true" className="absolute top-24 left-24 size-87 rounded-full border border-primary/10" />
            {/* Glass stage with a slowly turning gradient ring */}
            <div className="absolute top-25 left-28.5 size-78 rounded-full p-1 shadow-float">
              <div aria-hidden="true" className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,var(--color-primary),var(--color-magenta),var(--color-sky),var(--color-lavender),var(--color-primary))]" />
              <div className="relative flex size-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#fff_0%,var(--color-surface)_55%,var(--color-lavender)_100%)] shadow-[inset_0_2px_12px_rgba(255,255,255,0.9)]">
                <div aria-hidden="true" className="absolute bottom-14 h-4.5 w-35 rounded-[50%] bg-ink/15 blur-sm" />
                <PetSprite
                  stage={pet.stage}
                  size={256}
                  alt={`${pet.stage.name}, чиний тэжээвэр`}
                  className="relative animate-bob drop-shadow-[0_14px_22px_rgba(80,30,200,0.28)]"
                />
              </div>
            </div>
            <p className="absolute top-105 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/80 px-4.5 py-2 text-[15px] font-bold whitespace-nowrap shadow-float ring-1 ring-white backdrop-blur-md">
              <span>{pet.stage.name}</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-line" />
              <span className="text-primary">Түв. {pet.level}</span>
            </p>
            <div aria-hidden="true" className="absolute top-10 left-10 size-115 animate-[spin_60s_linear_infinite]">
              {orbitPets.slice(0, ORBIT_SPOTS.length).map(({ stage, element }, i) => (
                // The outer box counter-rotates so pets stay upright; the ring
                // animates inside it so the two never share an animation.
                <div
                  key={stage.name}
                  className="absolute size-20 animate-[spin_60s_linear_infinite_reverse]"
                  style={{ left: ORBIT_SPOTS[i].x, top: ORBIT_SPOTS[i].y }}
                >
                  <ElementRing
                    element={element}
                    className="flex size-full items-center justify-center rounded-full bg-white/70 shadow-card ring-1 ring-white backdrop-blur-md"
                  >
                    <PetSprite stage={stage} />
                  </ElementRing>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
