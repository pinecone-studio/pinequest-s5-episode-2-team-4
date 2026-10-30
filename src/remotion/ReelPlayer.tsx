"use client";

import { Player } from "@remotion/player";
import { cn } from "@/lib/cn";
import { REEL_FPS, Reel, type ReelProps, reelFrames, reelSize } from "./Reel";

/** The reel in a player with controls: phone-shaped, or wide for a horizontal reel. */
export function ReelPlayer({ className, ...props }: ReelProps & { className?: string }) {
  const { width, height } = reelSize(props.script.layout);
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-card bg-primary-dark shadow-card",
        props.script.layout === "horizontal" ? "max-w-[720px]" : "max-w-[360px]",
        className,
      )}
    >
      <Player
        component={Reel}
        inputProps={props}
        durationInFrames={reelFrames(props.timings)}
        compositionWidth={width}
        compositionHeight={height}
        fps={REEL_FPS}
        controls
        clickToPlay
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      />
    </div>
  );
}
