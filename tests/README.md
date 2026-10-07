# RagaMentor prototype tests

jsdom regression suites for `../prototype/index.html`. Each suite boots the
page headlessly, drives the app's own functions (no test framework), and asserts
behavior — every suite also fails if the page throws any JS error.

## Run

```sh
cd tests
npm install   # one-time: installs jsdom
npm test      # runs all *-test.js suites via run-all.js
```

Or run one suite directly: `node split-test.js`.

## Suites

| File | Covers |
|---|---|
| `newloop-test.js` | ＋ New loop chip inside group views (clears edit state, keeps group context, jumps to A–B) |
| `newloop-top-test.js` | ＋ New loop chip at top level (new loop stays ungrouped) |
| `roam-test.js` | Playhead roams free in A–B with a group selected; section wrap re-binds on leaving the tab |
| `checklist-top-test.js` | Top-level ＋ New group checklist offers only top-level items; ＋ Add stays the open reorganization tool |
| `subgroup-check-test.js` | Sub-group ＋ New group checklist offers only the parent's direct loops |
| `split-test.js` | Split at playhead (naming, note copy, group slot, eligibility); `addLoop` mixed-member sort fix |
| `backbtn-test.js` | Single destination-labeled back button (`‹ Pallavi` / `‹ All`); no breadcrumb chips |
| `pause-tap-test.js` | Tapping a group while paused moves the playhead without changing paused/playing state |
| `roundtrip-test.js` | Export → import round-trip incl. duplicate names (v2 id-based, v1 name-based fallback), idempotency |
