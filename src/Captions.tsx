import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AMBER } from "./colors";
import { FPS, LINES } from "./config";
import { fontFamily } from "./fonts";
import { easeOut } from "./math";

type Chunk = { from: number; to: number; text: string };

const buildChunks = (timeScale: number): Chunk[] =>
  LINES.flatMap((line) => {
    const s = Math.round(line.start * timeScale * FPS);
    const e = Math.round(line.end * timeScale * FPS);
    const weights = line.chunks.map((c) => c.replace(/\*/g, "").length + 2);
    const sum = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    return line.chunks.map((text, i) => {
      const from = s + Math.round(((e - s) * acc) / sum);
      acc += weights[i];
      const to = s + Math.round(((e - s) * acc) / sum);
      return { from, to, text };
    });
  });

const parse = (text: string): { t: string; accent: boolean }[] => {
  const parts: { t: string; accent: boolean }[] = [];
  const re = /\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), accent: false });
    parts.push({ t: m[1], accent: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), accent: false });
  return parts;
};

/** 2-3 words at a time, top of the frame, one bold amber word. */
export const Captions: React.FC<{ timeScale: number }> = ({ timeScale }) => {
  const frame = useCurrentFrame();
  const chunks = useMemo(() => buildChunks(timeScale), [timeScale]);
  const active = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!active) return null;

  const local = frame - active.from;
  const pop = easeOut(interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" }));
  const out = interpolate(frame, [active.to - 3, active.to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start" }}>
      <div
        key={active.from}
        style={{
          marginTop: 170,
          padding: "0 80px",
          fontFamily,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.08,
          letterSpacing: "0.02em",
          textAlign: "center",
          color: "#ffffff",
          opacity: pop * out,
          scale: 0.9 + 0.1 * pop,
          translate: `0px ${(1 - pop) * 22}px`,
          textShadow: "0 0 34px rgba(90,150,255,0.55), 0 5px 0 rgba(0,0,0,0.35)",
        }}
      >
        {parse(active.text).map((part, i) => (
          <span
            key={i}
            style={
              part.accent
                ? { color: AMBER, textShadow: "0 0 34px rgba(245,183,58,0.65), 0 5px 0 rgba(0,0,0,0.35)" }
                : undefined
            }
          >
            {part.t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
