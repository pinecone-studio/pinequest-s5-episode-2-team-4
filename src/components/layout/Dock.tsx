/**
 * Room the dock takes: its row (4.875rem: the nav's padding and a link's
 * icon, label and padding) and the gap above the iPhone home bar.
 */
const DOCK_SPACE = "h-[calc(4.875rem+max(0.75rem,env(safe-area-inset-bottom)))]";

/**
 * The floating dock at the bottom of phones and tablets (below lg), for the
 * student and teacher menus. It's fixed to the screen; a strip in the
 * footer's colour after the footer keeps its room, so at the end of the page
 * it sits below the footer instead of covering it, over the footer's colour
 * rather than the page backdrop.
 */
export function Dock({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className={`${DOCK_SPACE} bg-night lg:hidden`} />
      <div className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="relative mx-auto max-w-md">
          {/* The white dock is its own layer, not the nav: the nav is named for
              page transitions, and its snapshot must be transparent so the
              sliding circle shows beneath the icons. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-line bg-white/90 shadow-float backdrop-blur-md"
          />
          {children}
        </div>
      </div>
    </>
  );
}
