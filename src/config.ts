// ---------------------------------------------------------------------------
// Everything you might want to tweak lives in this file.
// ---------------------------------------------------------------------------

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Length of the video at the default pacing (seconds). */
export const BASE_SECONDS = 32;

/**
 * VOICEOVER
 * 1. Put your file at public/voiceover.mp3
 * 2. Set HAS_VOICEOVER = true
 * The video length and every beat then stretch/shrink to match the audio.
 */
export const HAS_VOICEOVER = false;
export const VOICEOVER_FILE = "voiceover.mp3";
/** Silence after the last word, so the loop breathes (seconds). */
export const END_PADDING_SECONDS = 0.35;

/** Optional quiet rain / ambience bed that runs under everything. */
export const HAS_AMBIENCE = false;
export const AMBIENCE_FILE = "ambience.mp3";
export const AMBIENCE_VOLUME = 0.18;

/** Frames two neighbouring scenes cross-fade for. */
export const CROSSFADE_FRAMES = 8;

export type SceneId =
  | "puddle-open"
  | "hair"
  | "top-bounce"
  | "bottom-bounce"
  | "waves"
  | "add-up"
  | "cancel"
  | "wedge"
  | "puddle-pullback"
  | "map";

export type SceneDef = { id: SceneId; start: number; end: number };

/** Scene boundaries in seconds at the default pacing. */
export const SCENES: SceneDef[] = [
  { id: "puddle-open", start: 0, end: 4.2 }, // lines 1-2
  { id: "hair", start: 4.2, end: 6.8 }, // line 3
  { id: "top-bounce", start: 6.8, end: 10.6 }, // line 4
  { id: "bottom-bounce", start: 10.6, end: 13.6 }, // line 5
  { id: "waves", start: 13.6, end: 17.6 }, // lines 6-7
  { id: "add-up", start: 17.6, end: 20.0 }, // line 8
  { id: "cancel", start: 20.0, end: 22.4 }, // line 9
  { id: "wedge", start: 22.4, end: 25.6 }, // line 10
  { id: "puddle-pullback", start: 25.6, end: 29.0 }, // line 11
  { id: "map", start: 29.0, end: 32.0 }, // line 12 + loop back to frame 0
];

export type LineDef = {
  id: number;
  start: number;
  end: number;
  /** Caption chunks (2-3 words). Wrap the bold/amber word in *asterisks*. */
  chunks: string[];
};

/** The script, with caption chunks. Times are seconds at default pacing. */
export const LINES: LineDef[] = [
  { id: 1, start: 0.15, end: 1.6, chunks: ["OIL HAS", "NO *COLOR*"] },
  {
    id: 2,
    start: 1.9,
    end: 4.1,
    chunks: ["YET ON A PUDDLE,", "IT SHOWS", "A *RAINBOW*"],
  },
  {
    id: 3,
    start: 4.4,
    end: 6.6,
    chunks: ["THE OIL FILM", "IS *THINNER*", "THAN A HAIR"],
  },
  {
    id: 4,
    start: 6.95,
    end: 10.2,
    chunks: ["LIGHT HITS", "THE *TOP*", "OF THE FILM", "SOME *REFLECTS*"],
  },
  {
    id: 5,
    start: 10.7,
    end: 13.4,
    chunks: ["THE REST", "GOES *THROUGH*", "AND REFLECTS", "OFF THE *BOTTOM*"],
  },
  {
    id: 6,
    start: 13.7,
    end: 15.4,
    chunks: ["TWO *REFLECTIONS*", "NOW TRAVEL", "TOGETHER"],
  },
  { id: 7, start: 15.7, end: 17.4, chunks: ["THEIR *WAVES*", "OVERLAP"] },
  {
    id: 8,
    start: 17.7,
    end: 19.9,
    chunks: ["FOR SOME COLORS,", "THE WAVES", "*ADD UP*"],
  },
  {
    id: 9,
    start: 20.1,
    end: 22.3,
    chunks: ["FOR OTHER COLORS,", "THEY *CANCEL* OUT"],
  },
  {
    id: 10,
    start: 22.5,
    end: 25.4,
    chunks: ["THE FILM’S", "*THICKNESS*", "DECIDES WHICH", "COLORS *SURVIVE*"],
  },
  {
    id: 11,
    start: 25.7,
    end: 28.8,
    chunks: [
      "*THICKNESS* CHANGES",
      "ACROSS THE PUDDLE,",
      "SO THE COLORS",
      "CHANGE *TOO*",
    ],
  },
  {
    id: 12,
    start: 29.0,
    end: 31.7,
    chunks: ["THE *RAINBOW*", "IS A MAP OF", "THE OIL’S", "*THICKNESS*"],
  },
];

/** The one technical label of the video (animated, appears with line 7). */
export const LABEL = { text: "INTERFERENCE", start: 15.5, end: 17.9 };
