"use client";

import { Player } from "@remotion/player";
import { cn } from "@/lib/cn";
import { REEL_FPS, REEL_HEIGHT, REEL_WIDTH, Reel, type ReelProps, reelFrames } from "./Reel";

/** The reel in a phone-shaped player with controls. */
export function ReelPlayer({ className, ...props }: ReelProps & { className?: string }) {
  return (
    <div className={cn("w-full max-w-[360px] overflow-hidden rounded-card bg-primary-dark shadow-card", className)}>
      <Player
        component={Reel}
        inputProps={props}
        durationInFrames={reelFrames(props.timings)}
        compositionWidth={REEL_WIDTH}
        compositionHeight={REEL_HEIGHT}
        fps={REEL_FPS}
        controls
        clickToPlay
        style={{ width: "100%", aspectRatio: `${REEL_WIDTH} / ${REEL_HEIGHT}` }}
      />
    </div>
  );
}
