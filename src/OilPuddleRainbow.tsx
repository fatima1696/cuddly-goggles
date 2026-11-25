import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { Backdrop } from "./Backdrop";
import { Captions } from "./Captions";
import { ScienceLabel } from "./ScienceLabel";
import { SceneTiming } from "./clock";
import {
  AMBIENCE_FILE,
  AMBIENCE_VOLUME,
  CROSSFADE_FRAMES,
  FPS,
  HAS_AMBIENCE,
  HAS_VOICEOVER,
  SCENES,
  SceneId,
  VOICEOVER_FILE,
} from "./config";
import { HairScene } from "./scenes/HairScene";
import { PuddleScene } from "./scenes/PuddleScene";
import { ReflectionScene } from "./scenes/ReflectionScene";
import { WaveScene } from "./scenes/WaveScene";
import { WedgeScene } from "./scenes/WedgeScene";

export type OilPuddleRainbowProps = { timeScale: number };

const buildTimings = (timeScale: number, total: number): SceneTiming[] => {
  const ends = SCENES.map((s, i) =>
    i === SCENES.length - 1 ? total : Math.round(s.end * timeScale * FPS),
  );
  return SCENES.map((_, i) => {
    const from = i === 0 ? 0 : ends[i - 1];
    const to = Math.max(from + 12, ends[i]);
    return { from, to, lead: i === 0 ? 0 : CROSSFADE_FRAMES, total };
  });
};

const renderScene = (id: SceneId, t: SceneTiming): React.ReactNode => {
  switch (id) {
    case "puddle-open":
      return <PuddleScene {...t} mode="open" />;
    case "hair":
      return <HairScene {...t} />;
    case "top-bounce":
      return <ReflectionScene {...t} part="top" />;
    case "bottom-bounce":
      return <ReflectionScene {...t} part="bottom" />;
    case "waves":
      return <WaveScene {...t} part="overlap" />;
    case "add-up":
      return <WaveScene {...t} part="add" />;
    case "cancel":
      return <WaveScene {...t} part="cancel" />;
    case "wedge":
      return <WedgeScene {...t} />;
    case "puddle-pullback":
      return <PuddleScene {...t} mode="pullback" />;
    case "map":
      return <PuddleScene {...t} mode="map" />;
  }
};

const SceneFade: React.FC<{ lead: number; children: React.ReactNode }> = ({
  lead,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity =
    lead > 0
      ? interpolate(frame, [0, lead], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const OilPuddleRainbow: React.FC<OilPuddleRainbowProps> = ({ timeScale }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const timings = useMemo(
    () => buildTimings(timeScale, durationInFrames),
    [timeScale, durationInFrames],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#04040a" }}>
      <Backdrop loop={frame / durationInFrames} />

      {SCENES.map((scene, i) => {
        const t = timings[i];
        return (
          <Sequence
            key={scene.id}
            name={scene.id}
            from={t.from - t.lead}
            durationInFrames={t.to - t.from + t.lead}
          >
            <SceneFade lead={t.lead}>{renderScene(scene.id, t)}</SceneFade>
          </Sequence>
        );
      })}

      <ScienceLabel timeScale={timeScale} />
      <Captions timeScale={timeScale} />

      {HAS_VOICEOVER && <Audio src={staticFile(VOICEOVER_FILE)} />}
      {HAS_AMBIENCE && (
        <Audio src={staticFile(AMBIENCE_FILE)} volume={AMBIENCE_VOLUME} loop />
      )}
    </AbsoluteFill>
  );
};
