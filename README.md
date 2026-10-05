# RagaMentor

Slow down and loop music practice phrases — built for learning by ear
(e.g. slowing a fast gamaka passage to 0.25x and looping it until it sticks).

## What's here

- `prototype/` — working web prototype (single self-contained HTML file, no build step):
  - import audio from the Files app, stored on-device in the browser (IndexedDB)
  - 1x → 0.25x pitch-preserving playback (`preservesPitch`)
  - multiple named A–B loops per song, persisted across sessions
  - waveform with click-to-seek, light/dark themes
- `index.html` — root redirect to the prototype (GitHub Pages serves from the repo root)

## Roadmap

See the full native iOS implementation plan alongside this repo's history —
SwiftUI + AVAudioEngine (`AVAudioUnitTimePitch`) for sample-accurate,
gapless looping on device.
