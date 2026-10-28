import type { Metadata } from "next";
import { getPetLines } from "@/lib/data";
import { isStarterPet } from "@/lib/pets";
import { FloatingPets } from "../_components/FloatingPets";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Бүртгүүлэх · LevelUp",
};

// Decorative pets around the form, positions from the design.
const DECOR = [
  { id: "kroki", left: 2.5, top: 24 },
  { id: "elofly", left: 3.5, top: 66 },
  { id: "rockitten", left: 91.5, top: 30 },
  { id: "helipi", left: 90.5, top: 62 },
];

export default async function SignupPage() {
  const petLines = await getPetLines();
  const decor = DECOR.flatMap(({ id, left, top }) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [{ stage: line.stages[0], left, top }] : [];
  });

  return (
    <main className="relative flex-1 px-4 pt-4 pb-16">
      <FloatingPets pets={decor} />
      <div className="relative mx-auto max-w-278">
        <h1 className="text-center text-[32px] leading-tight font-bold tracking-tight md:text-5xl">
          Бүртгүүлэх
        </h1>
        <SignupForm petLines={petLines.filter(isStarterPet)} />
      </div>
    </main>
  );
}
