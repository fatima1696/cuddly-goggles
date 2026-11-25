import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ICE } from "./colors";
import { FPS, LABEL } from "./config";
import { fontFamily } from "./fonts";

/** The one technical label in the video. It animates in and out. */
export const ScienceLabel: React.FC<{ timeScale: number }> = ({ timeScale }) => {
  const frame = useCurrentFrame();
  const s = Math.round(LABEL.start * timeScale * FPS);
  const e = Math.round(LABEL.end * timeScale * FPS);
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const inP = interpolate(frame, [s, s + 12], [0, 1], clamp);
  const outP = interpolate(frame, [e - 8, e], [1, 0], clamp);
  const opacity = inP * outP;
  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "31%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        translate: `0px ${(1 - inP) * 18}px`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 48,
          letterSpacing: "0.32em",
          paddingLeft: "0.32em",
          color: ICE,
          textShadow: "0 0 26px rgba(120,190,255,0.6)",
        }}
      >
        {LABEL.text}
      </div>
      <div
        style={{
          height: 3,
          width: 420 * inP,
          marginTop: 16,
          background: `linear-gradient(90deg, transparent, ${ICE}, transparent)`,
        }}
      />
    </div>
  );
};
