import type { Boss } from "@/lib/types";
import { ArenaBackground } from "@/app/(student)/pets/battle/ArenaBackground";

/** The boss's scene behind the whole screen, in full colour; only the edges darken. */
export function Backdrop({ arena }: { arena: Boss["arena"] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <ArenaBackground arena={arena} className="size-full saturate-[1.35] contrast-[1.05]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.35))]" />
    </div>
  );
}
