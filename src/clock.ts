import { useCurrentFrame } from "remotion";
import { FPS } from "./config";
import { clamp01 } from "./math";

export type SceneTiming = {
  /** First frame of the scene (global). */
  from: number;
  /** Last frame of the scene (global, exclusive). */
  to: number;
  /** Extra frames the scene starts early to cross-fade in. */
  lead: number;
  /** Total frames of the whole video. */
  total: number;
};

export type Clock = {
  /** Frames since the scene's own start (negative during the cross-fade). */
  f: number;
  /** Scene progress 0..1. */
  p: number;
  /** Global frame. */
  g: number;
  /** Scene length in frames. */
  len: number;
  /** Position inside the whole video, 0..1 (used to make the loop seamless). */
  loop: number;
  /** Seconds since the scene's start. */
  sec: number;
};

export const useClock = (t: SceneTiming): Clock => {
  const frame = useCurrentFrame();
  const f = frame - t.lead;
  const len = Math.max(1, t.to - t.from);
  const g = t.from + f;
  return {
    f,
    p: clamp01(f / len),
    g,
    len,
    loop: g / t.total,
    sec: f / FPS,
  };
};
