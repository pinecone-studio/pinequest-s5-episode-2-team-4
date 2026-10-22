import type { Metadata } from "next";
import { getCurrentPet, getPetLines } from "@/lib/data";
import { FloatingPets } from "../_components/FloatingPets";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Нэвтрэх · LevelUp",
};

// Decorative pets around the card, positions from the design.
const DECOR = [
  { id: "dollfin", left: 7, top: 26 },
  { id: "agnite", left: 14, top: 60 },
  { id: "anoleaf", left: 82, top: 30 },
  { id: "cardiling", left: 76, top: 64 },
];

export default async function LoginPage() {
  const [petLines, pet] = await Promise.all([getPetLines(), getCurrentPet()]);
  const decor = DECOR.flatMap(({ id, left, top }) => {
    const line = petLines.find((l) => l.id === id);
    return line ? [{ stage: line.stages[0], left, top }] : [];
  });

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 pt-22 pb-16">
      <FloatingPets pets={decor} size="lg" />
      <LoginForm pet={pet?.stage ?? petLines[0].stages[0]} />
    </main>
  );
}
