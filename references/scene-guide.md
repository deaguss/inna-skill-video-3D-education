# Scene Guide

Every video is described in `script.json`. This guide lists what it can express. `assets/template/script.json` is a complete working example.

## Top level

| Field | Meaning |
|---|---|
| `title` | Video title |
| `end_title`, `end_card` | Heading and text on the closing screen. Put disclaimers in `end_card`. |
| `set` | Colors for `wall`, `floor`, `desk`, and `panel` (the desk front) |
| `cast` | The characters, keyed by an id you choose |
| `scenes` | The scenes, in order |

## Cast

Characters sit behind a desk. One to three work best in a vertical frame.

| Field | Values |
|---|---|
| `name` | Display name |
| `seat` | `left`, `center`, or `right` |
| `skin`, `shirt`, `pants`, `hair` | Colors |
| `hairStyle` | `short`, `long`, `bob`, or `spiky` |
| `cheeks` | `true` adds blush |

Use a different silhouette and color for each character, so viewers can tell them apart at a glance.

## Scenes

| Field | Meaning |
|---|---|
| `id` | Number, also used for voice file names |
| `speaker` | A cast id, or `narrator` for a voice with no character on screen |
| `voice` | Text for text-to-speech, with numbers spelled out |
| `subtitle` | Text on screen |
| `expression` | The speaker's face |
| `camera` | `shot` and `move` |
| `actions` | What each character does, keyed by cast id |
| `props` | 3D objects that appear in this scene |
| `overlays` | 2D graphics that appear in this scene |
| `hold` | Extra seconds, for visuals that need time |
| `duration_seconds` | Written by `voice.mjs measure`. Estimated from word count if absent. |

While `narrator` speaks, characters freeze in their last pose. Give that scene `actions` if you want them to move instead.

## Camera

`shot` is `wide`, `medium:<id>`, `closeup:<id>`, or `desk`. `desk` can also take an id. `move` is `none`, `push`, `pull`, or `orbit`.

Vertical frames are narrow. The visible width at distance `d` is `2 × d × tan(fov/2) × 0.5625`, so use `wide` when two characters must share a frame. Vary the shot between scenes to keep the video moving.

## Actions

```json
"actions": { "mia": { "pose": "explain", "look": "camera", "expression": "happy" } }
```

- **`pose`:** `idle`, `explain`, `point`, `think`, `wave`, `cheer`, `shocked`, `laugh`, `slump`, `nod`
- **`look`:** `camera`, `other`, `left`, `right`, `up`, `down`
- **`expression`:** `relaxed`, `curious`, `teasing`, `serious`, `calm`, `mischievous`, `confident`, `mocking`, `shocked`, `forced smile`, `happy`, `gloomy`, `determined`, `embarrassed`
- **`sweat`:** `true` adds a sweat drop

## Props

```json
"props": [{ "shape": "sphere", "color": "#ffd76a", "size": 0.42, "pos": [-0.15, 2.45, -0.5], "glow": true, "at": 0.4 }]
```

- **`shape`:** `sphere` (`size` is the radius), `box` (`size` is `[w, h, d]`), or `bar` (grows upward from `pos`)
- **`glow`:** `true` ignores lighting, which suits suns and lights
- **`at`:** seconds after the scene starts

World coordinates: `x` goes right, `y` goes up, and `z` comes toward the camera. Characters sit at `x` -0.85, 0, or 0.85, with heads near `y` 1.67. The desk top is at `y` 0.87, and the wall is at `z` -3.2.

## Overlays

```json
"overlays": [{ "type": "number", "value": "≈5x", "text": "more scattering for blue", "color": "#7fc6ff", "at": 0.4 }]
```

| Type | Fields |
|---|---|
| `label` | `target` (cast id), `text`, `color` |
| `card` | `title`, `text`, `color`, `y` |
| `number` | `value`, `text`, `color`, `y` |
| `icons` | `items` (`icon`, `label`, `color`), `stagger`, `y` |

All types also accept `at`. The canvas is 720×1280.

- Subtitles start at `y` 150, and three lines end near `y` 290, so place graphics below `y` 300. `y` is the center of the graphic.
- Avoid roughly the bottom 20% and the right edge, because TikTok and Reels buttons cover them.

## Extending the engine

Edit the code in `scene/` when the script can't express something:

| To add | Edit |
|---|---|
| A pose or expression | `POSES` or `FACES` in `story.js` |
| A camera shot | `SHOTS` in `story.js` |
| A prop shape or set piece | `world.js` |
| An overlay type | `overlay.js` |
| A hair style | `makeHair` in `characters.js` |

Compute everything from time alone and keep no state between frames, because each frame is rendered several times at slightly different times.

Pose values: `aN` and `aP` are the arms on the negative and positive x sides, as `[rx, rz, elbow]`. A negative `rx` raises the arm forward, and -1.5 points it straight ahead. To aim at a direction `(dx, dy, dz)`, use `rz = asin(dx)` and `rx = atan2(-dz, -dy)`. Arms reach only about 0.66, so lean the character with `lean` or move the object if a hand falls short.
