"use client";

import { usePathname } from "next/navigation";
import type { PetStage } from "@/lib/types";
import { SiteFooter } from "./SiteFooter";

/** Full footer on the home page, the slim one everywhere else. */
export function StudentFooter({ pets }: { pets: PetStage[] }) {
  const pathname = usePathname();
  if (pathname === "/") return <SiteFooter variant="full" pets={pets} />;
  return (
    <div className="mt-16">
      <SiteFooter />
    </div>
  );
}
