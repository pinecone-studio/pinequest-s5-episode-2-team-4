"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PetSprite } from "@/components/pet/PetSprite";
import { cn } from "@/lib/cn";
import type { PetStage } from "@/lib/types";
import type { LevelState, MapStop } from "./mapStops";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Map geometry in px. The map reads top to bottom with the page: the first
// chapter at the top, locked chapters at the bottom under the clouds.
const LEVEL_SLOT = 104;
const CHAPTER_SLOT = 150;
const PAD_TOP = 70;
const PAD_BOTTOM = 160;
/** How far levels swing left and right of the centre, in % of the width */
const SWING = 29;

type Placed = MapStop & { x: number; y: number; slot: number };

function layout(stops: MapStop[]) {
  const total = stops.reduce(
    (sum, s) => sum + (s.kind === "chapter" ? CHAPTER_SLOT : LEVEL_SLOT),
    0,
  );
  const height = PAD_TOP + total + PAD_BOTTOM;
  let above = PAD_TOP;
  let levelIndex = 0;
  const placed: Placed[] = stops.map((stop) => {
    const slot = stop.kind === "chapter" ? CHAPTER_SLOT : LEVEL_SLOT;
    const y = above + slot / 2;
    above += slot;
    const x = stop.kind === "chapter" ? 50 : 50 + SWING * Math.sin(levelIndex++ * 0.85 + 0.5);
    return { ...stop, x, y, slot };
  });
  return { placed, height };
}

/** A smooth road through the points (Catmull-Rom as cubic Béziers). */
function roadPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const pts = [
    { x: points[0].x, y: points[0].y - 120 },
    ...points,
    { x: points.at(-1)!.x, y: points.at(-1)!.y + 120 },
  ];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const circle: Record<LevelState, string> = {
  done: "size-14 bg-sky shadow-[0_6px_0_var(--color-sky-dark)]",
  mastered: "size-16 md:size-18 bg-sky shadow-[0_7px_0_var(--color-sky-dark)]",
  weak: "size-16 md:size-18 border-4 border-magenta bg-pink shadow-[0_7px_0_#f3b8e0]",
  learning: "size-16 md:size-18 bg-line shadow-[0_7px_0_var(--color-lavender)]",
  good: "size-16 md:size-18 bg-lavender shadow-[0_7px_0_var(--color-line)]",
  untested: "size-16 md:size-18 border-3 border-lavender bg-white shadow-[0_7px_0_var(--color-lavender)]",
  soon: "size-11 border-2 border-dashed border-line bg-white/80 text-ink-muted",
  locked: "size-14 bg-surface text-ink-muted shadow-[0_6px_0_var(--color-lavender)]",
};

const STATE_LABEL: Record<LevelState, string> = {
  done: "дууссан",
  mastered: "эзэмшсэн",
  weak: "сул",
  learning: "нөхөж буй",
  good: "сайн",
  untested: "шалгаагүй",
  soon: "тун удахгүй",
  locked: "түгжээтэй",
};

const icon = {
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className="size-5">
      <rect width="16" height="11" x="4" y="11" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
};

// Deterministic sparkles so server and client render the same.
const SPARKLES = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 37 + 11) % 96 + 2,
  y: (i * 211 + 47) % 1000,
  color: ["bg-magenta", "bg-primary", "bg-sky-dark"][i % 3],
}));

type GameMapProps = {
  title: string;
  stops: MapStop[];
  pet: PetStage;
  /** Wild pets that live along the road */
  wildPets: PetStage[];
};

/**
 * The school year as a winding game map. Done chapters are ticked, the
 * current one is playable with the pet on the next level, and locked
 * chapters wait under the clouds until the chapter before is finished.
 */
export function GameMap({ title, stops, pet, wildPets }: GameMapProps) {
  const section = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  /** Collapsed: a window that scrolls inside; expanded: the whole map in the page. */
  const [expanded, setExpanded] = useState(false);
  const here = useRef<HTMLLIElement>(null);
  const [width, setWidth] = useState(0);
  const [showTop, setShowTop] = useState(false);
  /** Which way the pet's level is when it's off screen; null when on screen */
  const [hereDir, setHereDir] = useState<"up" | "down" | null>(null);
  // Kept while the arrow folds away, so it doesn't flip mid-animation.
  const [arrowDir, setArrowDir] = useState<"up" | "down">("down");
  if (hereDir && hereDir !== arrowDir) setArrowDir(hereDir);
  const { placed, height } = layout(stops);

  const chapters = placed.filter((s) => s.kind === "chapter");
  const doneCount = chapters.filter((c) => c.status === "done").length;
  const firstLocked = chapters.find((c) => c.status === "locked");
  const lastOpen = [...chapters].reverse().find((c) => c.status !== "locked");
  // The clouds cover everything below the first locked signpost.
  const cloudTop = firstLocked ? firstLocked.y - firstLocked.slot / 2 : height;

  // The road needs the map's width in px; levels are placed in %.
  useEffect(() => {
    const el = map.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The pet's level, else the current chapter's signpost.
  function hereTarget() {
    return here.current ?? map.current?.querySelector<HTMLElement>("[data-current-chapter]");
  }

  // "Back to top" once the page is scrolled; the "my position" arrow points
  // to the pet's level while it's out of sight (outside the window, or
  // outside the map's own scroll area when collapsed).
  useEffect(() => {
    const box = scroller.current;
    function update() {
      setShowTop(window.scrollY > 600);
      const target = hereTarget()?.getBoundingClientRect();
      let top = 80;
      let bottom = window.innerHeight - 120;
      if (!expanded && box) {
        const area = box.getBoundingClientRect();
        top = Math.max(top, area.top);
        bottom = Math.min(bottom, area.bottom);
      }
      if (!target) setHereDir(null);
      else if (target.bottom < top) setHereDir("up");
      else if (target.top > bottom) setHereDir("down");
      else setHereDir(null);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    box?.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      box?.removeEventListener("scroll", update);
    };
  }, [expanded]);

  /**
   * Brings the pet's level into view: in the page, or in the map's window.
   * `reveal` also scrolls the page so the map window is on screen.
   */
  function scrollToHere(behavior: ScrollBehavior = "smooth", reveal = true) {
    const target = hereTarget();
    const box = scroller.current;
    if (!target) return;
    if (expanded || !box) {
      const top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45;
      window.scrollTo({ top, behavior });
      return;
    }
    box.scrollTo({ top: target.offsetTop - box.clientHeight * 0.5, behavior });
    if (reveal) section.current?.scrollIntoView({ behavior, block: "nearest" });
  }

  // Collapsed, the map opens scrolled to where the student is.
  useEffect(() => {
    if (!expanded) scrollToHere("auto", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the mode changes
  }, [expanded]);

  function toggleExpanded() {
    setExpanded((e) => !e);
    // Keep the map's top in view when it grows or shrinks.
    requestAnimationFrame(() =>
      section.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  const points = placed.map((s) => ({ x: (s.x / 100) * width, y: s.y }));
  const road = width ? roadPath(points) : "";

  // A wild pet on the far side of every fourth open level.
  const wild = placed.flatMap((stop, i) =>
    stop.kind === "level" && stop.chapterStatus !== "locked" && stop.number % 4 === 2 && wildPets.length
      ? [
          {
            stage: wildPets[i % wildPets.length],
            x: stop.x < 50 ? Math.min(stop.x + 34, 90) : Math.max(stop.x - 34, 10),
            y: stop.y,
          },
        ]
      : [],
  );

  return (
    <section
      ref={section}
      aria-labelledby="map-title"
      className="relative mt-7 overflow-hidden rounded-[25px] bg-white shadow-card md:mt-6 md:rounded-panel"
    >
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b-2 border-surface px-5 py-4 md:px-8 md:py-5">
        <h2 id="map-title" className="text-xl leading-tight font-bold md:text-[28px]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.25 text-sm font-bold">
            {doneCount} / {chapters.length} бүлэг
          </span>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border-2 border-lavender bg-white px-3.5 text-sm font-bold text-ink hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
              {expanded ? (
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              )}
            </svg>
            {expanded ? "Хураах" : "Бүтнээр харах"}
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        tabIndex={expanded ? undefined : 0}
        aria-label={expanded ? undefined : "Жилийн замын газрын зураг, дээш доош гүйлгэнэ"}
        className={cn(
          "bg-flow",
          !expanded && "h-[620px] overflow-y-auto overscroll-contain md:h-[720px]",
        )}
      >
        <div ref={map} className="relative" style={{ height }}>
          {/* chapter zones */}
          {chapters.map((c, i) => {
            const next = chapters[i + 1];
            const top = c.y - c.slot / 2;
            const bottom = next ? next.y - next.slot / 2 : height;
            return (
              <div
                key={c.id}
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0",
                  c.status === "done" && "bg-sky/20",
                  c.status === "current" && "bg-lavender/30",
                )}
                style={{ top, height: bottom - top }}
              />
            );
          })}

          {/* sparkles */}
          {SPARKLES.filter((s) => s.y * (height / 1000) < cloudTop).map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn("absolute size-1.5 rotate-45 rounded-[2px] opacity-60", s.color)}
              style={{ left: `${s.x}%`, top: s.y * (height / 1000) }}
            />
          ))}

          {/* the road */}
          {road && (
            <svg aria-hidden="true" className="absolute inset-0" width={width} height={height}>
              <path d={road} fill="none" stroke="var(--color-line)" strokeWidth={46} strokeLinecap="round" />
              <path d={road} fill="none" stroke="white" strokeWidth={36} strokeLinecap="round" />
              <path
                d={road}
                fill="none"
                stroke="var(--color-lavender)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="2 14"
              />
            </svg>
          )}

          {wild.map((w, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-bob"
              style={{ left: `${w.x}%`, top: w.y, animationDelay: `${-i * 0.6}s` }}
            >
              <PetSprite stage={w.stage} className="size-12 max-w-none opacity-90 md:size-16" />
            </span>
          ))}

          <ol>
            {placed.map((stop) => {
              const locked =
                stop.kind === "chapter" ? stop.status === "locked" : stop.chapterStatus === "locked";
              const blurred = locked && stop !== firstLocked;

              if (stop.kind === "chapter") {
                const isGate = stop === firstLocked;
                return (
                  <li
                    key={stop.id}
                    data-current-chapter={stop.status === "current" ? "" : undefined}
                    className={cn(
                      "absolute w-max max-w-[min(340px,86%)] -translate-x-1/2 -translate-y-1/2",
                      isGate ? "z-30" : "z-10",
                      blurred && "blur-[4px]",
                    )}
                    style={{ left: `${stop.x}%`, top: stop.y }}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-card px-4 py-2.5 shadow-float",
                        stop.status === "current" ? "border-3 border-primary bg-white" : "bg-white",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          stop.status === "done" && "bg-sky",
                          stop.status === "current" && "bg-primary text-white",
                          stop.status === "locked" && "bg-surface text-ink-muted",
                        )}
                      >
                        {stop.status === "locked" ? icon.lock : ROMAN[stop.order - 1]}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[11px] font-bold text-ink-muted md:text-xs">
                          {ROMAN[stop.order - 1]} бүлэг ·{" "}
                          {stop.status === "done"
                            ? "дууссан"
                            : stop.status === "current"
                              ? "одоо энэ бүлэг"
                              : "түгжээтэй"}
                        </span>
                        <span className="text-sm leading-tight font-bold md:text-base">{stop.title}</span>
                        {isGate && lastOpen && (
                          <span className="mt-1 text-xs font-bold text-primary">
                            {ROMAN[lastOpen.order - 1]} бүлгээ дуусгаад нээгдэнэ
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              }

              const playable = Boolean(stop.href) && !locked;
              const label = `${stop.number}. ${stop.title}, ${STATE_LABEL[stop.state]}${stop.current ? ", одоо энд байна" : ""}`;
              const node = (
                <>
                  {stop.current && (
                    // Beside the level, towards the middle, so it hides no label.
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-0 z-10 animate-bob",
                        stop.x < 50 ? "left-[calc(50%+40px)]" : "right-[calc(50%+40px)]",
                      )}
                    >
                      <PetSprite stage={pet} className="size-16 max-w-none md:size-20" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "relative flex items-center justify-center rounded-full text-xl font-bold md:text-2xl",
                      stop.current
                        ? "size-16 animate-pulse-ring bg-primary text-white md:size-18"
                        : circle[stop.state],
                    )}
                  >
                    {stop.state === "done" || stop.state === "mastered"
                      ? icon.check
                      : stop.state === "locked"
                        ? icon.lock
                        : stop.state === "soon"
                          ? <span className="text-sm">{stop.number}</span>
                          : stop.number}
                  </span>
                  <span
                    className={cn(
                      "mt-2 max-w-full rounded-2xl px-2.5 py-0.5 text-center text-xs leading-tight font-bold",
                      stop.state === "soon" ? "bg-white/70 text-ink-muted" : "bg-white shadow-card",
                    )}
                  >
                    {stop.title}
                    {stop.state === "soon" && <span className="block text-[10px] font-semibold">тун удахгүй</span>}
                  </span>
                </>
              );

              return (
                <li
                  key={stop.id}
                  ref={stop.current ? here : undefined}
                  // Fixed width so long lesson names wrap the same anywhere on the road.
                  className={cn("absolute z-10 w-36 -translate-x-1/2 -translate-y-8 md:w-44", blurred && "blur-[4px]")}
                  style={{ left: `${stop.x}%`, top: stop.y }}
                >
                  {playable ? (
                    <Link
                      href={stop.href!}
                      aria-label={label}
                      className="flex flex-col items-center text-ink no-underline transition-transform hover:-translate-y-1 hover:text-ink"
                    >
                      {node}
                    </Link>
                  ) : (
                    <span aria-label={label} title={stop.state === "soon" ? "Тун удахгүй" : undefined} className="flex flex-col items-center">
                      {node}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* clouds over the locked chapters */}
          {firstLocked && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
              style={{ top: cloudTop - 40 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80" />
              {Array.from({ length: Math.ceil((height - cloudTop) / 90) + 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute animate-drift rounded-full bg-white blur-md"
                  style={{
                    left: `${((i * 41) % 80) - 10}%`,
                    top: i * 90 - 20,
                    width: `${40 + ((i * 17) % 30)}%`,
                    height: 90 + ((i * 13) % 40),
                    opacity: 0.85,
                    animationDelay: `${-((i * 1.7) % 9)}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating buttons, bottom right above the mobile bottom nav: "my
          position" in the corner, "back to top" to its left. */}
      <div className="fixed right-4 bottom-24 z-40 flex items-center gap-2.5 md:right-8 md:bottom-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Хуудасны эхэнд очих"
          aria-hidden={!showTop}
          tabIndex={showTop ? 0 : -1}
          className={cn(
            "flex size-12 cursor-pointer items-center justify-center rounded-full bg-white text-ink shadow-3d-soft transition-[opacity,translate,scale] duration-300 ease-out active:translate-y-1 active:shadow-none",
            !showTop && "pointer-events-none translate-y-3 scale-90 opacity-0",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5.5">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        {/* Always shown; the arrow only while the pet's level is off screen. */}
        <button
          type="button"
          onClick={() => scrollToHere()}
          className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-primary pr-4 pl-1.5 text-sm font-bold whitespace-nowrap text-white shadow-3d active:translate-y-1 active:shadow-none"
        >
          <span className="mr-2 flex size-9 items-center justify-center rounded-full bg-white">
            <PetSprite stage={pet} size={30} />
          </span>
          Миний байршил
          {/* The arrow grows in and folds away instead of popping, and turns
              between up and down. */}
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex overflow-hidden transition-[width,margin,opacity] duration-300 ease-out",
              hereDir ? "ml-2 w-4.5 opacity-100" : "ml-0 w-0 opacity-0",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "size-4.5 shrink-0 transition-transform duration-300 ease-out",
                arrowDir === "up" && "rotate-180",
              )}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}
