import type { Boss } from "@/lib/types";
import { ArenaBackground } from "../ArenaBackground";

/** The boss's scene behind the whole page (below the header), dimmed so cards stay readable. */
export function Backdrop({ arena }: { arena: Boss["arena"] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-18 bottom-0 -z-10 md:top-22">
      <ArenaBackground arena={arena} className="size-full" />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
