import { Config } from "@remotion/cli/config";

// Three.js needs a real GL backend when rendering headless.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
