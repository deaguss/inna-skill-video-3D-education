# Instructions for AI agents

This repo is a guide for creating 3D clay-style animated explainer videos with code.

When the user asks for an animated video, educational video, or explainer, read `SKILL.md` in full and follow its workflow. Read `references/scene-guide.md` when writing `script.json`.

The three rules that matter most, because breaking them has frozen a laptop or ruined a result:

- Render on the CPU with `--light`, always set `--limit`, and start with one frame.
- If a test fails, find out why before retrying, and ask the user if their machine may be at risk.
- Ask before downloading packages, rendering a full video, or deleting files.
