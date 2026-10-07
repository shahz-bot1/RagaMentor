# RagaMentor — iOS Music Practice App
## Implementation Plan (MVP)

**Status:** Refined 2026-10-05 — every MVP interaction validated in the web prototype · UI redesigned 2026-10-06 (tabbed fullscreen + slim home screen, all validated in prototype) · Loop groups added 2026-10-06 · Nested sub-groups (2-level cap) added 2026-10-06 · **Super-app framing 2026-10-07: RagaMentor is the home/launcher; LoopLab (slow-down + phrase loops, the current prototype) is the first sub-app**
**Repo:** shahz-bot1/RagaMentor · **Prototype (live):** https://shahz-bot1.github.io/RagaMentor/prototype/ · **Home (live):** https://shahz-bot1.github.io/RagaMentor/
**Local prototype:** ~/workspace/ios-slowdown-app/prototype/index.html (single self-contained file)
**One-liner:** Import a song, slow it to quarter speed without changing pitch, and loop any phrase as many times as you need — every loop named, annotated, and saved.

### Target user
Musicians and vocal students learning by ear — e.g. slowing a fast gamaka passage to 0.25x and looping a single phrase until it sticks, with per-loop notes for key and vocal cues.

---

## 1. What the web prototype validated

Built first as a single-file web app to de-risk UX before native work. Everything below was exercised in the prototype and carries over to native:

| Prototype behavior | Native implication |
|---|---|
| `preservesPitch` 0.25x–1x slowdown | `AVAudioUnitTimePitch` at 0.25x must pass the same listen test (M2) |
| Tap waveform → fullscreen; drag = scrub | Tap-vs-drag disambiguation (~10pt movement / 350ms) |
| Pinch to zoom (min 2s window), drag to pan, tap to seek | `UIPinchGestureRecognizer` + pan; peaks re-bucketed per zoom level |
| Tabbed fullscreen panel: persistent mini-transport + speed presets, tabs for Loops / A–B / Speed | Bottom sheet with the same structure — shared view model, different container |
| Loop chips (wrapping) + selected loop's editable name + delete + note, all in the Loops tab | Chips row + detail section; same selection model |
| A/B stepper rows: 0.1s micro-nudge + Set buttons; loop toggle + add-loop in the A–B tab | Stepper rows at 0.1s; coarse moves via tap-seek + Set A/B |
| Per-loop note field (key, vocal cues), multiline — Return = newline, blur/Done saves | `note` on `LoopRegion`; multiline inline editing |
| Selected-loop badge overlaid top-right on waveform (tap = restart loop); time as non-interactive badge on waveform | Same overlays in native waveform view |
| Speed presets slowest-first (0.25x → 1x); granular slider 0.1x–1x in the Speed tab | Same ordering; slider for fine values |
| Fixed waveform height in fullscreen (panel grows downward, no resize glitch on tab switch) | Fixed-height waveform view, scrolling sheet below |
| Nested loop groups (2 levels): top groups hold loops + sub-groups; tap = open members + loop whole section | `LoopGroup` entity, members = loop OR group ids; group range derived bottom-up; section loop via same segment scheduler |
| Songs keyed by SHA-256 content hash | Same (CryptoKit): re-import dedupes, loops survive |
| IndexedDB persistence across reloads | SwiftData with identical restore semantics |

Decisions the prototype settled:
- **Keyboard time-entry was tried and rejected** — fiddly on mobile; tap-seek + 0.1s nudge covers precision.
- **Waveform stays in MVP** — setting loop points without visual feedback is unusable; 6000 peaks proved crisp at max zoom.

---

## 2. MVP scope

**In scope**
- Import audio from the Files app (MP3, M4A/AAC, WAV, AIFF, CAF); **content-hash dedupe** — re-importing a file opens the existing song, loops intact
- Song library, fully on-device
- Play/pause/seek transport; ±10s skip
- Speed 0.1x → 1.0x (presets slowest-first: 0.25x, 0.5x, 0.75x, 1x + fine slider down to 0.1x), pitch locked
- Multiple named A–B loops per song: Set A/B at playhead, **0.1s micro-nudge**, tap loop to select + jump, loop on/off, rename, delete
- **Nested loop groups (2-level cap, 2026-10-06)**: a top-level group holds loops and sub-groups (e.g. Pallavi → Opening → Varnam line 1); sub-groups hold loops only. Tapping any group opens it and arms its whole section for looping (range derived bottom-up: earliest descendant start → latest descendant end); like tapping a loop, it moves the playhead to the section start without changing the paused/playing state. One checklist manages membership: `＋ New group` inside a top-level group creates a sub-group and offers only that group's loops; `＋ Add` offers all loops plus other flat groups (only groups without sub-groups may be nested — cycles impossible by construction). A single back button labeled with the destination (`‹ Pallavi` inside a sub-group, `‹ All` inside a top-level group) goes up one level — no breadcrumb trail, so nav chips can't be mistaken for groups. Deleting a group promotes its children one level up (loops ungroup, sub-groups surface); empty groups auto-vanish, cascading. Waveform bands stack (parents lighter, children stronger); group detail shows `N items · a – b · in “parent”`
- **Per-loop note field** — free text for key, swara/vocal cues
- Waveform: inline + **fullscreen mode** (tap to expand; pinch zoom to 2s window; drag to pan; tap to seek; auto-follow playhead while playing)
- Tabbed fullscreen panel (persistent transport + presets; Loops / A–B / More tabs)
- Loops, notes, last position, last selected loop persist across launches
- Song-level loop list interchange: export/import JSON (file-local serial ids + names + notes + ordered member lists; round-trips exactly even with duplicate names; the file never carries database ids — import mints fresh ones); import replaces existing loops (no legacy format support — prototype)
- Background audio; pause on phone-call interruption / headphone disconnect

**Out of scope (v2 parking lot)**
- Apple Music / Spotify integration (DRM — technically impossible for any third-party app)
- Pitch shifting / transposition
- Recording, metronome, loop export/share as audio
- Cloud sync, folders/playlists, sleep timer, Apple Watch

---

## 3. Key product decisions

| # | Decision | Status |
|---|----------|--------|
| 1 | Audio source: Files-app import only (streaming catalogues are DRM-encrypted; no decodable buffer) | Locked |
| 2 | Engine: AVAudioEngine + AVAudioPlayerNode + AVAudioUnitTimePitch (not AVAudioPlayer — need clean pitch-preserving slowdown + sample-accurate looping) | Locked |
| 3 | Speed 0.25x–1.0x, pitch locked at 0¢ | Locked |
| 4 | Song identity: SHA-256 content hash; import dedupes | Locked |
| 5 | Waveform in MVP, incl. fullscreen zoom mode | Locked |
| 6 | A/B nudge step: 0.1s | Locked |
| 7 | Per-loop notes | Locked |
| 8 | Persistence: SwiftData, fully on-device, no login, no backend | Locked |
| 9 | Minimum iOS 17+ (SwiftData floor) | Locked |
| 10 | Fullscreen = tabbed panel (Loops / A–B / Speed) with persistent transport + presets; home screen = launcher (now playing above library, no loop UI — fullscreen owns it) | Locked 2026-10-06 |
| 11 | Loop groups: a group is a named loop-container; tap = open + loop section; range derived, never set; single checklist for membership; delete keeps loops; empty groups vanish | Locked 2026-10-06 |
| 12 | Nested sub-groups capped at 2 levels (section → sub-section → phrases); new sub-group offers only the parent's loops; `＋ Add` stays the open reorganization tool; delete promotes children one level | Locked 2026-10-06 |

---

## 4. Tech stack
- Swift 6, SwiftUI, latest stable Xcode
- AVFoundation: AVAudioEngine, AVAudioPlayerNode, AVAudioUnitTimePitch, AVAudioSession, AVAssetReader (waveform peaks)
- CryptoKit (SHA-256 for import dedupe)
- SwiftData for persistence
- No third-party dependencies for MVP; no backend, no accounts, no analytics

---

## 5. Architecture

```
┌──────────────┐     ┌───────────────────┐     ┌───────────────┐
│ SwiftUI      │────▶│ PlaybackController│────▶│ AudioEngine   │
│ Views        │◀────│ (@MainActor,       │◀────│ (AVAudioEngine │
│              │     │  Observable)       │     │  graph)       │
└──────────────┘     └───────────────────┘     └───────────────┘
                            │  ▲
                            ▼  │
                     ┌───────────────────┐
                     │ SwiftData store   │
                     │ Song / LoopRegion │
                     └───────────────────┘
```

- **Views** stay thin: LibraryView, PlayerView, FullscreenWaveformView. All state flows from PlaybackController.
- **PlaybackController**: single source of truth — transport state, speed, active loop, playhead position (~20 Hz), zoom viewport. Owns the engine lifecycle.
- **AudioEngine**: owns the AVAudioEngine graph; exposes play/pause/seek/setRate/setLoop/clearLoop; reports position.
- **ImportService**: document picker → SHA-256 → dedupe check → sandboxed copy → metadata + waveform peaks → Song record.

---

## 6. Data model (SwiftData)

```swift
@Model
final class Song {
    @Attribute(.unique) var id: UUID
    var title: String
    var contentHash: String          // SHA-256 of file bytes; dedupe key
    var fileRelativePath: String     // Application Support/Audio/<hash>.<ext>
    var duration: Double             // seconds
    var sampleRate: Double
    var dateAdded: Date
    var lastPosition: Double         // resume point
    var lastLoopID: UUID?            // restores selected loop
    @Relationship(deleteRule: .cascade) var loops: [LoopRegion]
    @Relationship(deleteRule: .cascade) var groups: [LoopGroup]
}

@Model
final class LoopGroup {
    @Attribute(.unique) var id: UUID
    var name: String                 // e.g. "Pallavi"
    var colorHex: String             // waveform band color
    var memberIDs: [UUID]            // LoopRegion OR LoopGroup ids, kept sorted by start time
    var song: Song?
    // range is DERIVED bottom-up: min(descendant.start) → max(descendant.end); never stored
    // invariants: one parent per item; DEPTH CAPPED AT 2 (sub-groups hold loops only —
    //   cycles impossible by construction, no recursion in range/breadcrumb/delete logic);
    //   empty groups are deleted (cascading)
}

@Model
final class LoopRegion {
    @Attribute(.unique) var id: UUID
    var name: String                 // default "Loop 1", "Loop 2", …
    var note: String                 // key, vocal cues — free text, inline editable
    var start: Double                // seconds
    var end: Double                  // seconds
    var sortOrder: Int
    var createdAt: Date
    var song: Song?
}
```

**Validation rules**
- `0 ≤ start < end ≤ song.duration`; minimum loop length 0.3 s
- Set B at/before A → auto-swap with subtle haptic (no error alert)
- Deleting a song cascade-deletes its loops and removes the audio file + cached peaks

---

## 7. Audio engine — the core

### Graph
```
AVAudioPlayerNode → AVAudioUnitTimePitch → mainMixerNode → output
```

```swift
engine = AVAudioEngine()
playerNode = AVAudioPlayerNode()
timePitch = AVAudioUnitTimePitch()   // rate = speed, pitch = 0 (locked)
engine.attach(playerNode); engine.attach(timePitch)
engine.connect(playerNode, to: timePitch, format: file.processingFormat)
engine.connect(timePitch, to: engine.mainMixerNode, format: file.processingFormat)
try engine.start()
```

### Playback modes
- **Full song**: `playerNode.scheduleFile(audioFile, at: nil)` then `play()`.
- **Active loop [A, B]**: `playerNode.scheduleSegment(audioFile, startingFrame: frame(A), frameCount: frames(B−A), at: nil)` with a `.dataPlayedBack` completion handler that **re-schedules the same segment** while the loop is active → gapless infinite loop.
- **Speed change**: set `timePitch.rate` live — no rescheduling, no dropout.
- **Seek / loop-point change**: `playerNode.stop()`, schedule from the new frame, `play()`.

### Position reporting
```swift
// filePosition ≈ segment.startingFrame + playerTime.sampleTime
guard let nodeTime = playerNode.lastRenderTime,
      let playerTime = playerNode.playerTime(forNodeTime: nodeTime) else { return nil }
```
Publish ~20 Hz. The segment-offset math is the fiddliest part — prove it in the M2 spike against a file with known timestamps before building UI on top.

### Session & interruptions
- `AVAudioSession`: category `.playback`, mode `.default`; activate on first play; `UIBackgroundModes = audio`.
- Interruption notification → pause on begin, offer resume on end; route-change → pause on headphone unplug.
- MPNowPlayingInfoCenter / lock-screen remotes: v1.1.

### Format & quality notes
- MP3/AAC/WAV/AIFF/CAF via AVAudioFile.
- TimePitch at 0.25x is good for practice on most material; dense mixes can smear — explicit listen test in M2 with real practice material (fast vocal phrase), mirroring the prototype's browser listen test.

---

## 8. Import pipeline

1. SwiftUI `.fileImporter(isPresented:allowedContentTypes: [.audio])`
2. SHA-256 of the file (CryptoKit, streamed for large files)
3. **Dedupe**: Song with this hash exists → select it, discard import, done (loops intact)
4. Else copy to `Application Support/Audio/<hash>.<ext>` (hash-named files make dedupe nearly free)
5. AVAsset duration/sampleRate → create `Song`
6. Background job: AVAssetReader → 16-bit PCM → ~6000 peak buckets → sidecar `Data` cache
7. Failures: unsupported/corrupt file (surface error, clean partial copy), storage full

---

## 9. Waveform

- Peaks computed once at import (§8.6), ~6000 buckets — prototype-proven crisp at max zoom; render with SwiftUI `Canvas`, re-bucketing per pixel for the current zoom window.
- **Inline**: fit-to-width; tap = fullscreen, drag = scrub.
- **Fullscreen**: `UIPinchGestureRecognizer` (min 2s window, zoom anchored at pinch midpoint), pan gesture when zoomed in, tap = seek; **auto-follow**: while playing, page the view when the playhead exits; Fit / + / − buttons.
- Overlays: playhead line, all loop regions shaded, selected loop highlighted, dashed A/B markers for the working region.
- Peaks not ready yet → flat-line fallback until the job finishes; bucket count fixed so long files cost the same to render.

---

## 10. UI/UX

**LibraryView**
- Rows: title, duration, "N loops"; tap → PlayerView; `+` import; swipe-to-delete (file + loops + peaks); empty state.

**PlayerView (home — a launcher; all loop management lives in fullscreen)**
- Now Playing card sits **above** the Library so it stays visible as the song list grows
- Song title + fullscreen expand button; taller waveform preview; selected-loop badge top-right on the waveform (tap = restart loop); time badge bottom-center (non-interactive)
- Centered transport (−10s | play/pause | +10s); slim speed presets, slowest-first
- No A–B controls, loop list, add-loop, or import/export on home — fullscreen owns all of it

**FullscreenWaveformView**
- Header: close (✕), song title, zoom controls (− / + / Fit); waveform height fixed (tab switches resize the sheet below, never the waveform)
- Selected-loop badge top-right on waveform (tap = restart loop: jump to loop start, play if paused); time badge bottom-center (non-interactive, taps pass through to seek)
- Persistent mini-transport (play, ±10s) + speed presets (0.25x → 1x) below the waveform, visible on every tab
- Tabs: **Loops** / **A–B** / **Speed**
  - Loops: two-level chips — top level shows group chips (color dot, ▸, count) + ungrouped loop chips + dashed `＋ New group`; tapping a group opens it (single `‹ {parent}` / `‹ All` back button + mixed member chips sorted by start + `＋ New loop` + `＋ Add` + `＋ New group` only in top-level groups) and loops the whole derived section; the back button goes up one level (`‹ All` at top level returns and clears selection). `＋ Add` opens the single membership checklist (✓ = member; checking an item elsewhere moves it; offers loops + flat groups only — sub-groups hold loops only). `＋ New group` inside a top-level group creates a sub-group whose checklist offers only that group's own direct loops (never loops inside its sub-groups — same visible-at-this-level rule as top level). ＋ New group` at top level offers only top-level items (ungrouped loops + flat top-level groups — never anything nested inside another group); ＋ Add` stays the open reorganization tool (all loops + flat top-level groups, checking moves) Done applies; empty groups vanish (cascading). New loops created in the A–B tab while inside a group join that group. Group detail: editable name, `N items · a – b` summary + nested-in crumb + Loop on/off toggle (mirrors the A–B tab toggle), delete promotes children one level up (nothing is lost). Third fullscreen tab renamed 2026-10-06 from Speed to **More**: Speed section (granular slider, as before) + **Backup** section (centered ⤓ Export / ⤒ Import + status line). Main-screen Now Playing card keeps its slim speed presets untouched — only the Backup section moved off it
  - A–B: "Editing …" header; A and B stepper rows (0.1s nudge −/+, Set at playhead); loop on/off toggle; add-loop row (name + Add). With a group selected, A–B edits scratch for a new loop — member loops are never mutated, and the section wrap is suspended so the playhead roams the whole song (A/B can land outside the group's current range; the derived range expands when the new loop joins). Explicit entry: a ＋ New loop chip (top level, before ＋ New group, and inside group views next to ＋ Add) drops whatever is being edited, keeps the open group (if any) as context, and jumps to the A–B tab; leaving the tab re-binds the section loop, selecting another loop/group discards scratch A/B. Split: while editing a loop, a Split button next to the Loop toggle cuts the loop in two at the playhead (enabled only when the playhead is at least 0.3s inside each end; the button state refreshes as the playhead moves). The first piece keeps the name, the second becomes "name 2" ("name 3"... on collision; a trailing number is bumped), the note is copied to both, both take the original's slot in its group in order, and the first piece stays selected and looping. Carving out an unwanted middle = split twice, delete the middle piece
  - Speed: granular slider 0.25–1.0 for in-between values
- Waveform overlays add per-group color bands (derived bottom-up, parents drawn first and lighter so nested bands read) behind group-tinted member loop regions; the selected group highlights like a selected loop
- No "pitch locked" label anywhere — pitch preservation is the premise, not a mode

**Loop list interchange (song level)**
- Export JSON: `{app: "RagaMentor", version: 1, song, exportedAt, loops: [{name, start, end, note}], groups: [{name, color, loops: [loop names], groups: [sub-group names]}]}` — times in seconds (2dp), human-readable and hand-editable
- Import: file picker on `.json`; validated per entry (numeric start/end, clamped to duration, min 0.3s, invalid entries skipped); groups rebuilt by matching member names to imported loops and sub-group names to imported groups (two passes, one parent per item; the 2-level cap, cycle-breaking, and empty-group cleanup enforced defensively); **replaces** the song's existing loops and groups outright — no merge
- Native: `Codable` structs; export via share sheet (`UIActivityViewController` → Files), import via `fileImporter`

**Gestures**: tap-vs-drag disambiguation on the waveform (10pt / 350ms thresholds, per prototype).

---

## 11. Persistence & restore
- SwiftData `ModelContainer`, autosave on
- On song open: seek to `lastPosition`, reselect `lastLoopID` if it exists
- Throttle `lastPosition` writes (~5s + on pause/background)
- Reinstall wipes the sandbox (expected); iCloud device backup covers Application Support by default

---

## 12. Edge cases & quality bar
- Set B ≤ A → auto-swap with haptic; loop < 0.3s → extend B
- Re-import of same file → dedupe, never duplicates (hash collision practically impossible)
- Corrupt/zero-duration file → import error state, no Song row
- Bluetooth: playhead may lag audio ~100–200ms — acceptable
- Pinch-vs-pan disambiguation per prototype thresholds
- No analytics/crash reporting in MVP (add at TestFlight if wanted)

---

## 13. Testing plan
- **Unit**: seconds↔frames, loop clamp/swap, SHA-256 dedupe (same bytes → same song), persistence round-trip incl. notes
- **Prototype as oracle**: every MVP interaction has a working web reference — behavior-parity checklist before 1.0
- **Device (real iPhone)**: 0.25x listen test by ear, gapless loop seam, pinch/pan gestures, background + lock, call interruption, headphone unplug, airplane mode (all offline)
- **TestFlight**: 2–3 musician testers — "loop a 5-second phrase at 0.25x for 10 minutes — what annoyed you?"

---

## 14. Milestones & rough effort (solo, part-time)

| Milestone | Scope | Rough effort |
|-----------|-------|--------------|
| M1 | Scaffolding, import + SHA-256 dedupe, basic transport, library UI | ~1 week |
| M2 | **Audio engine spike**: 0.25x time-pitch quality, position math, gapless segment loop — prove before UI | 3–4 days |
| M3 | A–B loops: set/select/toggle, 0.1s nudge, rename/delete, per-loop notes | ~1 week |
| M4 | Persistence/restore (position, selection, notes), delete flows | 3–4 days |
| M5 | Waveform: peaks job + inline rendering + fullscreen zoom/pan/follow + chips + floating panel | ~1.5 weeks |
| M6 | Interruptions, background, edge cases, TestFlight | ~1 week |

**Total: roughly 6 weeks part-time** (rough estimates; M2 is the schedule risk — if the loop seam or position math fights back, it borrows from M5).

**Acceptance criteria:** import MP3 → re-import dedupes to the same song → 0.25x pitch-intact → 3 named loops with notes → force-quit → everything intact → fullscreen pinch-zoom → tap chip → playhead jumps to A and loops seamlessly → export loops JSON → delete all → import → loops + notes restored.

---

## 15. v2 parking lot (closed until 1.0 ships)
Pitch shift (± semitones), loop export/share as audio, folders & search, sleep timer, lock-screen / now-playing controls, count-in click, iCloud sync.

---

## 16. App Store release checklist
- Bundle ID + App Store Connect record; `UIBackgroundModes: audio`
- Privacy manifest: no data collected → "Data Not Collected" label
- Icon, screenshots, preview video (screen recording of a loop at 0.25x sells it)
- TestFlight internal → external (2–3 testers) → 1.0

---

## 17. Risks
1. **TimePitch quality at 0.25x** on dense material — mitigate: M2 listen test with real practice audio (prototype's browser test passed on vocal material).
2. **Position-reporting offset math** with scheduled segments — mitigate: spike first against known timestamps.
3. **Scope creep** — parking lot §15 stays closed until 1.0 ships.
