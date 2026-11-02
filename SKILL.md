---
name: 3d-education-video
description: Creates 3D clay-style animated explainer videos with code (Three.js, Puppeteer, FFmpeg), from script to vertical MP4 for TikTok, Reels, or Shorts. Use this skill whenever the user wants an animated video, educational video, explainer, or 3D animated content on any topic, including when they only name a topic like "make a video about black holes" or share a video whose style they want to match. No 3D software required.
---

# 3D Education Video

This skill turns any topic into a vertical 3D clay-style video without 3D software. Characters, the set, camera moves, and on-screen graphics are all defined in one file, `script.json`.

Users are often not programmers. Explain things in plain language, work in the user's language, and show results rather than code.

This guide works with any AI agent that can read files and run commands. Adapt if your tool is limited:

- **Can't view images:** ask the user to check `sheet.png` and fix what they report. Don't claim you checked an image.
- **Can't run background processes:** give the user the full render command to run in their own terminal, so a tool timeout doesn't kill it.
- **Can't run commands at all:** help with the script, then give the user the commands one at a time.

## Workflow

Work in order. Script revisions are free and renders take time, so get approval before the expensive steps.

### 1. Settle the brief

Ask only what isn't clear: topic, audience, length, platform, and how many characters. New accounts usually do better with 30–45 seconds. If the user shares a reference video, take the style from a few frames, but create original characters. Don't copy someone else's characters or download their video.

### 2. Write the script

Copy `assets/template/` to a new project folder, then replace `script.json` completely. The bundled "Why is the sky blue?" video and its characters are only an example, so design a cast and set that fit the user's topic and brand. `references/scene-guide.md` lists every option.

- Open with the most interesting moment, because viewers decide whether to stay in the first few seconds.
- Keep `voice` (numbers spelled out, for text-to-speech) separate from `subtitle` (numbers as digits).
- Check facts, and calculate any numbers with a script rather than estimating. A wrong number undermines educational content.
- Estimate length as word count divided by 2.5, plus about 0.5 seconds per scene.
- For finance, health, or legal topics, put a disclaimer in `end_card`, mark examples as hypothetical, and avoid specific recommendations or promised results.

Show the script as a table of dialogue and get approval before continuing.

### 3. Install the tools

Run `npm install` in the project folder, with no global installs. First, tell the user that Three.js, Chrome, and FFmpeg will download, about 800 MB in total, and ask for permission. `.puppeteerrc.cjs` keeps Chrome inside the project folder. If npm skips the install scripts, read them first, then run `npm install-scripts approve ffmpeg-static puppeteer` and `npm rebuild ffmpeg-static puppeteer`.

### 4. Test frames

Render a frame from every scene, combine them into a contact sheet, then check and fix them yourself before showing the user. The render prints each scene's start time, so you can pick the timestamps.

```bash
node render.mjs --light --scale 0.75 --samples 4 --limit 150 --still 1,8,12,17 --out test
node contact-sheet.mjs test sheet.png
```

Look for cropped faces, hidden subjects, graphics overlapping subtitles, wrong numbers, and eyes or mouths that look off. Recheck after changes. Use a new output folder each time rather than deleting the old one.

Most fixes belong in `script.json`. Edit the code in `scene/` only when the video needs something the script can't express, such as a new pose or prop shape.

### 5. Render a short preview

Render about the first 10 seconds, check it, then send it to the user. Ask them to judge the motion, since stills can't show stiff movement.

```bash
node render.mjs --light --scale 0.75 --samples 4 --limit 900 --from 0 --to 10 --out preview.mp4
```

### 6. Add voices

Do this before the final render, because voice length sets the animation timing. The user prepares one clip per scene in `voices/`, named by scene id: `01.wav`, `02.mp3`, and so on.

```bash
node voice.mjs measure
```

This writes `duration_seconds` to `script.json`. Check which system voices exist before offering them, because the language the user needs may not be installed. Any text-to-speech API key stays with the user, so don't ask them to paste it into chat. Web-based tools avoid the key entirely. Remind them to check that their plan allows commercial use.

### 7. Full render

Give a time estimate based on the measured speed and get approval. Render in the background and remind the user not to let the laptop sleep.

```bash
node render.mjs --light --scale 0.75 --samples 4 --limit 5400 --out video.mp4
node voice.mjs mux video.mp4 final.mp4
```

When it finishes, pull frames from the finished video and check them before sending it.

## Protecting the user's machine

A render that is too heavy can freeze a laptop and lose unsaved work.

- Use `--light` by default. It forces rendering onto the CPU and cancels the render if the browser isn't using the CPU renderer.
- Always set `--limit` as a time guard.
- On Windows, run at low priority on half the cores:
  ```bash
  cmd /c "start \"\" /b /low /affinity 3F /wait node render.mjs ..."
  ```
  `3F` means 6 cores. Calculate it from the machine's core count. On macOS or Linux, use `nice -n 19`.
- Start with one frame. If a test fails or hits the limit, find out why before retrying, and ask the user if the machine may be at risk.
- Use the GPU only with specific permission, one frame first, after reminding the user to save their work.
- Don't delete files without permission.

## Quality and limits

| Setting | Use |
|---|---|
| `--scale 0.75 --samples 4` | Previews and CPU releases. No real camera blur. |
| `--samples 6` or more | Turns on camera blur and soft shadows. Use at least 16 to avoid ghosting. Much slower. |

As a guide, the first setting took about 0.8 seconds per frame on a laptop using 6 cores, so an 84-second video took about 35 minutes. Measure again on each machine.

## Mistakes already made

- **The first frame hangs on every backend:** usually the 2D canvas. Using `ctx.filter = 'blur()'` on thousands of shapes hung the render and was the suspected cause of a laptop freeze. Draw one gradient sprite and reuse it with `drawImage`.
- **Doubled images:** camera blur with too few samples. `main.js` already turns it off below 6 samples.
- **Eyes turn blank white:** scaling a pupil on all axes pushed it inside the eyeball. Scale pupils on x and y only.
- **A check that silently failed:** a mistyped search printed nothing and the script reported "clean". Check the exit code before trusting a scan, especially before publishing.
