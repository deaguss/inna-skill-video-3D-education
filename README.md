# 3D Education Video

A guide for AI coding agents that turns any topic into a vertical 3D clay-style explainer video, from script to MP4. No 3D software and no manual drawing: characters, the set, camera moves, and graphics are all defined in one JSON file and rendered with Three.js, Puppeteer, and FFmpeg.

## What it does

1. Writes a script with dialogue, expressions, camera moves, and visuals for each scene.
2. Builds your own cast and set from that script.
3. Renders test frames on the CPU with a time limit, so your laptop doesn't freeze.
4. Measures your voice clips and fits the animation timing to them.
5. Renders the full video and adds the voices.

## Install

This works with any AI tool that can read files and run commands:

```bash
git clone https://github.com/deaguss/inna-skill-video-3D-education.git 3d-education-video
```

Open the `3d-education-video` folder in your AI tool, then ask something like: "Make a 45-second 3D animated video about black holes for TikTok."

| AI tool | File it reads automatically |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex CLI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/3d-education-video.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Other tools | Say: "Read `SKILL.md` and follow its workflow." |

All of these point to `SKILL.md`, so there is only one guide to maintain.

To make it available in every project in Claude Code, install it as a skill:

```bash
git clone https://github.com/deaguss/inna-skill-video-3D-education.git ~/.claude/skills/3d-education-video
```

You need Node.js 18 or newer. The first video project downloads Three.js, Chrome, and FFmpeg into the project folder, about 800 MB in total.

Browser-based chat AIs can't run the render on your computer. There, you can use this guide for the script, then run the commands yourself.

## Make it yours

The included "Why is the sky blue?" video is only an example. Describe your topic and audience, and the AI writes a new `script.json` with its own characters and set. `references/scene-guide.md` lists every option.

## Limitations

- CPU renders are preview quality (540×960 scaled to 720×1280), without real camera blur.
- Voices aren't generated for you. Record your own or use a text-to-speech service.
- Mouths open and close but aren't precisely lip-synced.
- Characters sit behind a desk. Walking and other sets need code changes.
- GPU rendering can overload laptops with integrated graphics, so the CPU is the default.
- So far it has only been tested on Windows 11 with Claude Code. A clean install and other AI tools haven't been tested yet.

## License

[MIT](LICENSE)
