# Why oil puddles make rainbows

Vertical 9:16 science short (1080x1920, 30 fps, about 32 s) built with
Remotion + Three.js. The ending frame is the opening frame, so it loops.

## Run it

```bash
npm install
npm run dev        # Remotion Studio preview
npm run build      # renders out/oil-puddle-rainbow.mp4
```

## Add your voiceover

1. Put the audio at `public/voiceover.mp3`.
2. In `src/config.ts` set `HAS_VOICEOVER = true`.

The video length becomes the audio length (+0.35 s) and every scene, caption
and label stretches to match. If a line lands early or late, edit its
`start` / `end` seconds in `LINES` and `SCENES` (same file).

Optional: a quiet rain loop at `public/ambience.mp3` and `HAS_AMBIENCE = true`.

## Render on GitHub

1. Upload all files of this project to a repo.
2. GitHub skips the hidden `.github` folder when uploading, so add the workflow
   by hand: Add file > Create new file, name it `.github/workflows/render.yml`,
   paste the contents of `render.yml`, commit.
3. Actions tab > "Render video" > Run workflow.
4. When it finishes, download the `oil-puddle-rainbow` artifact (the MP4).

## Where things are

```
src/config.ts            script lines, caption chunks, scene timing, voiceover switch
src/OilPuddleRainbow.tsx scene sequencing, cross-fades, audio
src/scenes/              one file per kind of shot
src/three/               Three.js pieces (glow lines, thin-film shader, camera)
src/colors.ts            palette + the thin-film colour maths
```

## Physics used

The puddle colours are computed, not painted. For every pixel the oil
thickness h (nm) sets, per wavelength, how the two reflections combine:
intensity = 0.5 - 0.5 cos(4 pi n h / lambda), with n = 1.5, summed over
400-700 nm into RGB. Thin film: colours. Very thin: black. Thick: they wash out.
