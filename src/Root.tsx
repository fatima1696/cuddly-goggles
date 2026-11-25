import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { OilPuddleRainbow, OilPuddleRainbowProps } from "./OilPuddleRainbow";
import {
  BASE_SECONDS,
  END_PADDING_SECONDS,
  FPS,
  HAS_VOICEOVER,
  HEIGHT,
  VOICEOVER_FILE,
  WIDTH,
} from "./config";

/**
 * Without a voiceover the video runs at the default pacing (32 s).
 * With one, the whole timeline is stretched to fit the audio's length.
 */
const calculateMetadata: CalculateMetadataFunction<OilPuddleRainbowProps> = async () => {
  if (!HAS_VOICEOVER) {
    return {
      durationInFrames: Math.round(BASE_SECONDS * FPS),
      props: { timeScale: 1 },
    };
  }
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(staticFile(VOICEOVER_FILE)),
  });
  const seconds = await input.computeDuration();
  const total = seconds + END_PADDING_SECONDS;
  return {
    durationInFrames: Math.ceil(total * FPS),
    props: { timeScale: total / BASE_SECONDS },
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="OilPuddleRainbow"
    component={OilPuddleRainbow}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={Math.round(BASE_SECONDS * FPS)}
    defaultProps={{ timeScale: 1 }}
    calculateMetadata={calculateMetadata}
  />
);
