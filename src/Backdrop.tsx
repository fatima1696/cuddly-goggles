import React from "react";
import { AbsoluteFill } from "remotion";
import { NAVY } from "./colors";

/** Near-black navy with a soft radial glow that breathes once per loop. */
export const Backdrop: React.FC<{ loop: number }> = ({ loop }) => {
  const drift = Math.sin(loop * Math.PI * 2) * 2.5;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 46% at 50% ${44 + drift}%, rgba(48,80,134,0.55) 0%, rgba(12,18,42,0.88) 50%, ${NAVY} 82%)`,
      }}
    />
  );
};
