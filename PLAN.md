# RagaMentor — iOS Music Practice App
## Implementation Plan (MVP)

**Status:** Refined 2026-10-05 — every MVP interaction validated in the web prototype · UI redesigned 2026-10-06 (tabbed fullscreen + slim home screen, all validated in prototype) · Loop groups added 2026-10-06 · Nested sub-groups (2-level cap) added 2026-10-06 · **Super-app framing 2026-10-07: RagaMentor is the home/launcher; LoopLab (slow-down + phrase loops, the current prototype) is the first sub-app** · **Tala Studio added 2026-10-08: tala keeper as the second sub-app** — v1 shipped with 4 talas; **v2 (2026-10-08) rebuilt around the full suladi sapta tala system (Dhruva/Matya/Rupaka/Jhampa/Triputa/Ata/Eka) × 5 jatis (Tisra 3/Chatusra 4/Khanda 5/Misra 7/Sankeerna 9)** plus Misra/Khanda Chapu (fixed 7/5, no jati). Circular tala-wheel UI with samam in gold, combination name as hero ("Khanda Dhruva"; "Adi" alias in gold for Chatusra Triputa), anga formula + akshara count under the wheel, 30–120 bpm slider, subdivision 1/2/3/4 per beat (1st/2nd speed, tisra/chatusra nadai), tap tempo, floating Start/Stop bar, Web Audio lookahead scheduler. Old v1 "adi" settings migrate to Triputa+Chatusra. **Varisai Studio added 2026-10-09: structured Carnatic lessons as the fourth sub-app** — live at /varisai/; 50 patterns: Sarali 14 (user-verified), Janta 12 (PDF order), Dhattu 2, Sapta Tala Alankarams 7, Mandhra/Madhya/Mel sthayi 5 each; lesson data in varisai/lessons.js (separate data layer); lesson list + pattern player (grouped swara notation via dlines, S R G / S R₁ G₃ label toggle, Sa/Speed/Labels compact dropdowns, tempo 30–90 BPM default 60 slider, speed 1x/2x/4x/8x swaras-per-beat, seamless loop, tempo-aware legato overlap at all speeds, dheergam holds extend previous note, restart-on-setting-change, sing-back placeholder); harmonium samples shared from raga/samples/harmonium/; mock approved at mocks/varisai-mock.html; DECIDED: Mayamalavagowla only, no raga selector (practice-in-any-raga is a future advanced mode via raga-page deep links); piano skipped for v1. **2026-10-10: laya/tala/grouped notation ported from mock to RagaMentor** (user-approved) — new shared components: StudioUI.layaDisplay, talaDisplay (tappable with coachmark legend), groupedGrid; all 50 patterns have laya/tala/dlines; mock repo is now the lesson-data source of truth. **2026-10-09:** label-toggle default flipped to basic (S R G M) per user ("default to be basic, apply to all") — was raga-default; an explicitly stored "full" choice is still respected; applies to every Varisai swara display (player chips + pattern previews); RagaBrowser detail view still needs the same toggle (design pending). **Laya/tala/grouped notation (2026-10-10 ported from mock to RagaMentor):** per-pattern laya spec = slot pattern + tala grouping, from the shivkumar.org janta-varisai PDF the user shared 2026-10-09 (research/janta-varisai-shivkumar.pdf; all 12 patterns' specs extracted in research/laya-patterns.md). Janta Varisai · 2 worked example — 10 lines, emphasis travelling up/down the seven notes — laya 11-22-33-44 (slot assignment: each swara doubled in order → SS RR GG MM) with grouping (12-12-12-12): pairs chunked with gaps between pairs, FOR TALA COUNT ONLY — the notes never change (corrected 2026-10-09 after an earlier mock misread it as SR SR SR SR; user: "simply grouping… just for thala count. No sa ri - sa ri"). Slot digits are line-relative scale degrees; grouping digits are chunk positions, not swara selectors. "X and Y" in the PDF = special-laya line + plain 11-22-33-44 repeat line (patterns 3–12 are alternating line pairs; pattern 2 is the exception, both halves 11-22-33-44). Alankarams have tala field (PDF laghu structure verbatim, e.g. "I4 0 I4 I4") with tappable Tala UI + coachmark legend. Sthayi patterns grouped 4 swaras per group. Laya conventions: `-` is a pure logical group separator (never a rest); `,` dheergam holds sustain in playback; 2-part laya alternates per line (part 1 → odd lines, part 2 → even lines). **RagaBrowser added 2026-10-08: raga find/search/select as the third sub-app** — 72 melakartas (names verified against naada repo, MIT; swaras from the Venkatamakhin formula, anchor-checked; G1/N1/R3/D3 semitone-map bug fixed) + 4 janya ragas (Mohanam, Hamsadhvani, Abhogi, Hindolam); three tabs (Search by name/swaras, Favourites with ☆ starring persisted in localStorage, Melakartas chakra-grouped browse with M1/M2 toggle); detail view with arohana/avarohana chips, harmonium timbre only (sampled, CC-BY 3.0) — vocal/choir/AI timbres removed 2026-10-08, swara-singing vocal shelved for revisit; 11 Hindustani ragas (8 added 2026-10-08: Desh, Yaman, Bhairavi, Bhimpalasi, Malkauns, Bhairav, Kafi, Darbari Kanada — Desh avarohana Ni corrected to komal N2 same day; 3 added 2026-10-08: Ahir Bhairav, Saba, Sikah maqams as 12-TET approximations under "Maqam" thaat) with dedicated tab grouped by thaat, Carnatic/Hindustani notation toggle in detail view (defaults by system), Melakartas All tab now flat ordered list; movable Sa (C-B chromatic, persisted, compact dropdown 2026-10-10) with piano display (v14 2026-10-10: tempo-aware swara overlap): true continuous strip Sa->Sa' masked by overflow, dynamic white width (8 whites when Sa white, 7+overhang when black), adjacent-key slivers at edges, uniform black spacing, version badge, Sargam/Western label toggle in Listen header (persisted); piano in Listen card; playback highlights keys; Web Audio sample playback; super-app theme (dark-first, blue accent, theme toggle). **Compose Studio — SHIPPED 2026-10-13 (fifth sub-app; design confirmed 2026-10-12, mock preview validated by user):** a list of the user's own compositions; "+ New" opens a composition page with the Swara Builder P3 Flow Strip editor (free-flow chips, per-chip durations ¼–4 beats, stacks that subdivide their own beats, holds/all-hold stacks extend the previous note, bottom-sheet picker with stack prefill, raga selector incl. chromatic, Sa, tempo 30–120, loop toggle, per-chip playhead); list rows carry a play button (quick-play/stop); composition page carries Export (JSON envelope: app/version/kind/composition) and Delete (confirm → back to list); Import lives on the list page and ignores name clashes — every composition is stored under a fresh internal id, no name checks; compositions auto-save to localStorage; mock P3 gained an Export button producing the same envelope so playground phrases migrate via export → import. **As shipped:** live at /compose/ on the shared architecture (shared/studio.css, StudioTheme with the shared slowloop-theme key, StudioUI.tempoSlider, StudioAudio; samples from raga/samples/harmonium/); post-preview additions from user validation: insert before/after from the chip edit sheet (＋ popover at the sheet's top-right, outside-tap dismisses), raw JSON edit mode ({ } JSON toggle; one chip per line; Apply runs the import sanitizer), and long holds sustain via a new shared StudioAudio.playSampledSustain (equal-power crossfaded sustain chain — no loop jump or dip); same localStorage key as the preview (compose-studio-v1, same origin) so preview compositions carry over automatically; tests tests/compose-test.js (47 assertions) + tests/sustain-test.js (14) green. **Post-ship fixes 2026-10-13 (user validation, same evening):** (1) swara picker now offers the arohana ∪ avarohana union (arohana order first, then avarohana-only sthanas appended — e.g. Bhairavi gains D1), in both the shipped studio and the mock core; (2) chips use the playground's exact compact one-line layout — the port's added octave-dot chip styling, which forced each stacked swara onto its own line and ballooned cell height, was removed. **Octave dots on chips (2026-10-13, later same evening, user-driven):** a CSS slot design (reserved dot rows above/below each letter, chips ~16–18px taller) shipped first (mock build 2026.10.13-7) but the user found the dots mis-centred over letter+subscript; after a rendered Slot-vs-Diacritic comparison he chose the **combining-diacritic** style — the dot is part of the letter glyph itself (U+0307 above for upper octave, U+0323 below for lower), subscript untouched, zero layout change, chips back to the exact compact height. Shipped in Compose Studio and synced to the mock (P3 + Compose preview, build 2026.10.13-8, via SB.chipLabelHTML); P1 grid slots keep their CSS dots. Caveat: rendering depends on the font's combining-mark support — Chromium verified clean, the user's iPhone is the final check; the Slot design is the built-and-verified fallback if SF renders the dots off-centre. **Varisai Studio (same evening, user request):** lower notes now use the same diacritic placement — the combining dot U+0323 sits immediately after the LETTER (via the dotLow helper) instead of after the whole label, where in full-label mode it landed under the digit; the mock's grouped (dlines) display previously showed no lower dot and now does too; upper-octave apostrophes and the dashed borders on lower chips are unchanged; the 533-test Varisai data suite stays green. **LoopLab Swaras — SHIPPED 2026-10-14 (user design 2026-10-14, validated in the mock repo first):** every loop can carry ONE swara phrase of its own, stored on the loop record in IndexedDB (`lp.swaras = {ragaId, saOffset, tempo, loop, chips}`) — loop-private, it never appears in Compose Studio. The **Loops tab** gains a **Swaras section** under the selected loop's name row, bound to the selected loop: no loop → "select a loop" hint; loop without a phrase → empty state with ＋ Add swaras; with a phrase → read-only chips (combining-diacritic octave dots), a round Play button in the section header (layout B, user-chosen from rendered options), a tempo slider row (same stored tempo as the composer), and Edit. The composer is Compose Studio's editor transplanted onto the loop's storage (bottom-sheet picker with stacks + insert popover, raw JSON mode validated by the same sanitizer, Delete swaras with confirm, ‹ Done returns; edits auto-save like all A–B changes). Loops with phrases show a ♪ marker on their Loops-tab chip. Split keeps the phrase on the first piece only (the second starts empty). Song loops export/import JSON stays format v3 with an additive per-loop `swaras` field, sanitized on import; older files import with no phrases. Phrase playback rides the shared StudioAudio (harmonium samples + playSampledSustain long holds); starting phrase playback pauses the song, and toggling song playback stops the phrase. Tests: tests/swaras-test.js (36 assertions) + all 11 prior suites green. **Post-ship fix 2026-10-14 (user report, same day):** the composer overlay originally sat at z-index 30 — under LoopLab's own fullscreen overlay (#fsOverlay, z 1000) — so tapping Add opened it behind/below the loop view; composer is now z 1100 and the picker veil/sheet (carried over from Compose at z 40/41) are overridden to 1110/1111 in LoopLab. Layering guarded by assertions in tests/swaras-test.js (38). **Post-ship fixes 2026-10-14 (second round, user reports):** (1) the composer's Done button id collided with the transport's Back-10s button (`backBtn`) — the transport kept the id, the composer's is now `swDoneBtn`; (2) the transplant had dropped picker CSS (`.pgrid` fixed 4-column grid, `.stacktgl`, `.selchip`, `.donebtn2`, `.sliderow`) — restored verbatim, so picker cells are fixed-size like Compose; (3) the composer's StudioUI tempo slider never built because the glue checked `window.StudioUI` (the shared components register lexical globals, not window properties) — now a `typeof` guard, verified by the production-order repro suite; (4) the Swaras section moved from the A–B tab to the **Loops tab** (user request); (5) the picker's stack confirm is now a proper **Done** button instead of ✅ — applied in LoopLab, Compose Studio and the mock core. Tests: tests/swaras-test.js now 44 assertions, all 13 LoopLab suites green. **RagaBrowser pick link — SHIPPED 2026-10-14 (user design, iterated in the mock until confirmed):** the composers' raga dropdown no longer lists the built-in table; it shows **Chromatic · Recents (last 5 ragas set, most-recent first) · Favourites · "RagaBrowser ›"** — groups deduped (first group wins) and the current raga always present (it leads Recents if it is in neither group). Choosing RagaBrowser stores a resume note and opens **RagaBrowser in pick mode** (`raga/?pick=1&return=…`, same-origin checked): a banner explains, and each raga's detail page gains a **✓ Use this raga** button that writes the pick (`ragabrowser-pick-v1`) and returns; the originating composer consumes it on load, reopens exactly where he was (Compose: the composition; LoopLab: song → loop → composer with the phrase created if needed) and applies the raga. Picks resolve to a built-in table id by **scale signature** first (RagaBrowser's "Dheerasankarabharanam" = the table's "Shankarabharanam"), else they are stored in a personal registry (`raga-registry-v1`, `rb-` ids) that the sanitizers, picker and playback all resolve. **Favourites bridge:** RagaBrowser's ☆ favourites (its own `raga-favs` key, unchanged) are mirrored with full scale data into `raga-fav-data-v1` on every star change and at boot; each composer imports them into the registry at boot (`syncFavRegistry`) as the dropdown's Favourites group — un-starring removes a favourite-sourced entry, while a raga adopted by an actual pick (src "pick") is kept. **LoopLab per-song raga memory (user request):** the last raga selected on a song is kept on the song record (`song.swRagaId`, updated on dropdown change, pick-apply and raw-JSON apply), and a new loop phrase preselects it (fallback Mohanam). Incidental fix in the same pass: the transplanted editor's raga/Sa handlers called a non-existent `restartIfPlaying()` (a Compose name) instead of `swRestartIfPlaying()` — changing raga or Sa with the editor open would have thrown after saving; fixed. Tests: tests/raga-link-test.js (17, Compose: bridge, dropdown structure, browse drive, resume, signature match, unstar), tests/raga-browser-test.js (9, pick mode + mirror wiring), tests/swaras-test.js now 55 (dropdown, song memory, preselect, resume); all 15 suites green. **Playback highlight fix 2026-10-17 (user report):** the playing chip in LoopLab never lit up — the Swaras transplant had dropped the `--warn`/`--bad` CSS variable definitions (used by `.fchip.cur`, the section Play button’s playing state and the composer Delete button), so those colours were discarded. LoopLab now defines them (dark: warn #fbbf24, bad #f87171; light: warn #b45309, bad #dc2626; plus `--warn-ink` for text on the warn colour), and the highlight is stronger in BOTH composers: the playing chip now fills with the warn colour (readable ink text, matching border + outline) instead of a thin outline alone. Manual Stop now clears the highlight in both composers. Tests: compose-test 55, swaras-test 58, all suites green. **Length stepper + unified stop look 2026-10-17 (user requests):** in BOTH composers the picker’s Length row is no longer a fixed list (¼/½/1/2/4) but a −/value/+ stepper in ¼-beat steps from ¼ to 8 beats, with fraction labels (1¼, 1½, ¾); the sanitizers now accept any ¼ step in ¼–8 (non-¼ or out-of-range values reset to 1, so old files are unaffected) and chip labels use the fraction formatter. Phrase play/stop buttons are unified: the Stop state keeps the Play button’s exact design (shape, size, colour) — only the icon (and the editor word Play→Stop) changes; the old playing-state recolours (list-row blue fill, editor red, LoopLab section amber) are removed, so amber means only the playing chip. Tests: compose-test 63, swaras-test 67, all 15 suites green. **Highlight softened 2026-10-17 (user: amber too bright; chose the tinted option from a design note on the “tint, don’t paint” principle):** the playing chip in both composers no longer fills with amber — its background is now its own panel colour mixed with 22% accent blue (a lighter, tinted surface), text keeps its normal colour, and a 2px accent outline ring marks the current chip. Amber (--warn) remains defined for genuine warnings only. All 15 suites green. **Flat stop icon 2026-10-17 (user spot):** the phrase Stop state used ⏹ (U+23F9), which iOS renders as the “stop button” emoji inside the button, while Play ▶ is a flat text glyph — all four phrase buttons in both composers now use the flat ■ (U+25A0, same geometric family as ▶) so Play and Stop match in style and inherit the button colour. All 15 suites green. **Background-audio fix 2026-10-17 (user report: after the browser returns from background, Play produced no sound until a refresh):** iOS leaves the shared AudioContext in the non-standard “interrupted” state, but StudioAudio.ensure() only resumed a “suspended” one, so the engine stayed frozen. ensure() now resumes whenever the context is not running (shared/audio.js, loaded as ?v=2 by Compose + LoopLab). Both composers also stop phrase playback when the page hides and call StudioAudio.ensure() when it shows again — the same pattern RagaBrowser got on 2026-10-08, now in the shared layer. All 15 suites green.
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
- The `.playback` category is what frees the native app from the web prototypes' silent-switch limitation: on iOS, Web Audio API output (RagaBrowser mock synth/samples, Tala Studio metronome) is classified as interactive/ambient sound and muted by the silent switch, while `<audio>` elements (LoopLab song playback) take the media-playback route and are not. Native `.playback` guarantees ALL app audio — loops, metronome, raga samples — sounds regardless of the switch. Web prototypes carry a "turn off silent mode" hint instead (no JS API can change this).
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
- **Native CI (decided 2026-10-17):** the native app lives in its OWN public repo, separate from this prototype repo. GitHub Actions (free on public repos) + fastlane auto-build and run tests on every push; TestFlight uploads only on tags / main merges. No paid Apple account is needed for debug builds or simulator tests; free provisioning (personal Apple ID) covers on-device debug with 7-day expiry and a 3-app limit; the paid Developer Program (~£79/yr) is needed only for TestFlight / App Store distribution.
- **Native CI (LIVE 2026-10-17):** repo `shahz-bot1/RagaMentor-iOS` (public), bundle uk.co.shahz.ragamentor, iOS 17+. The pipeline is green end to end: on every push to main, GitHub Actions (macos-15) runs fastlane lane `test` (unit tests on an iPhone 16 simulator) and lane `build_unsigned` (unsigned device archive zipped into `RagaMentor-iOS-unsigned.ipa`, uploaded as a run artifact, 14-day retention). CI republishes the IPA to a permanent `latest` GitHub release on every green build of main, and the repo root carries a SideStore source (`apps.json`) pointing at it. Version lineage: v0.1.0 Hello World → v0.1.1 Gamaka-wave icon → v0.2.0 M1 → v0.6.0 M1–M6 complete (run 39055499414; 25 unit tests, all green). Distribution route: free sideload. On-device install was reached on 2026-10-17: SideStore itself was sideloaded via AltServer, and RagaMentor was then installed through iloader's direct Install IPA, because SideStore's own in-app sign-in still fails with -80045 after Apple's 13 Oct 2026 sign-in change. Refresh path: re-run iloader's Install IPA with the current `latest` IPA before each 7-day free-signing expiry (first install 17 Oct → refresh by ~24 Oct 2026). App data survives overwrite installs.
- **Hands-off execution (2026-10-17):** Shahzin authorized autonomous execution of this plan in RagaMentor-iOS ("start executing the plan. Use your best judgement. I will be hands off."). M1–M6 were built and CI-verified the same day. What remains is his on-device acceptance pass against the §14 criteria. Two verdicts are ear-only and CI cannot prove them: the realtime loop seam, and TimePitch quality at 0.25x on real material.
- **M2 finding — offline rendering:** AVAudioEngine manual (offline) rendering does not pick up segments scheduled from `.dataPlayedBack` completion handlers; passes after the first rendered silent in tests. The offline path therefore pre-schedules loop passes (count = requested frames ÷ output-per-pass at the current rate, +2 margin). The realtime path keeps completion-handler re-scheduling, which is what makes the live loop gapless.
- **Parity programme (approved 2026-10-17):** the native app will be brought to full feature parity with this web suite — all five studios, UI matched, native advantages kept — under a modular protocol-oriented architecture (Swift Packages: RagaCore, AudioKit, PersistenceKit, DesignSystem, RagaLibrary, SwaraEditor, one feature module per studio, AppShell). The detailed plan, including the per-suite test translation from the web baseline (16 suites, 795 assertions, all passing 2026-10-17), lives in `PARITY-PLAN.md`. It supersedes the §15 parking-lot closure for the items it lists. Milestones P0–P6, parity release = v1.0.0.
- **P0 shipped 2026-10-17 (v0.7.0, build 10):** the v0.6.0 code now lives in local Swift Packages — RagaCore (pure logic), AudioKit (AudioEngine + PeaksService behind the `FilePlaybackEngine` protocol), PersistenceKit (SwiftData models + `SongStore`/`SwiftDataSongStore`), DesignSystem (tokens), LoopLab (controller, import, all views) — with the app target as AppShell linking the full graph. Tests split per module (RagaCore 17, AudioKit 4, PersistenceKit 1, LoopLab 2, App 1), 25/25 green, run 39061586074. LaunchScreen added with `INFOPLIST_KEY_UILaunchStoryboardName` — the app now runs full screen. Model class names are unchanged, so the on-device SwiftData store carries over. Next: P1 (RagaLibrary + SwaraEditor + LoopLab Swaras + loops v3).
- **P1 shipped 2026-10-17 (v0.8.0, build 11):** RagaLibrary service (Recents MRU-5, Favourites, personal registry, per-song raga memory — one store), SwaraEditor module (shared phrase editor + picker + raw JSON mode), LoopLab Swaras section, harmonium ToneEngine with the equal-power sustain chain, the full 87-raga catalog in RagaCore. Loops backup is now the web's v3 format in both directions — one platform-independent JSON, byte-consistent with the web export (ordered writer, JS timestamps); the short-lived native v1 format was retired entirely (user decision 2026-10-17). 57/57 tests green (run 39068306906); IPA on `latest`. Also approved 2026-10-17: **P1.5 design pass (v0.8.1)** — the web design language (studio.css tokens, cards, segmented controls, chips, theme setting default dark) built into DesignSystem and applied to LoopLab + SwaraEditor before P2 (PARITY-PLAN §10). **P1.5 SHIPPED 2026-10-17 (v0.8.1, build 14, run 39073669217, 60/60 tests):** the web design language in DesignSystem (StudioPalette + components), LoopLab + SwaraEditor restyled, one theme setting (default dark). Two v0.8.0 hotfix rounds preceded it: build 13 (phrase-playback crash fix — notes rendered in the player node's format; raga browse sheet so the catalog is reachable in the editor; Settings page with version/build) and build 14's picker-sheet fix (editor model created once per presentation). **P2 SHIPPED 2026-10-18 (v0.9.0, build 15, run 39111517151, 65/65 tests):** Compose Studio — Composer package (list + the shared SwaraEditor as host #2), CompositionStore (compose-studio-v1), web envelope export/import byte-consistent, AppShell tabs (LoopLab / Compose) with one shared PhrasePlayer for cross-studio interlock. **P3 SHIPPED 2026-10-18 (v0.10.0, build 16, run 39116657743, 73/73 tests):** RagaBrowser — the full 87-raga browser (Search with pitch-folded swara classes, Favourites, Melakarta chakra accordion, Hindustani thaats), detail with notation toggle, Listen card and the display piano, and the live RagaPicker in both swara editors (interim sheet retired for real hosts). App has three tabs: LoopLab / Compose / Ragas. **VARISAI SHIPPED 2026-10-18 (v0.11.0, build 18, run 39123373695, 79/79 tests)** — built ahead of Tala at Shahzin's call (P4/P5 swap): Varisai package with the full lesson catalog generated from the mock source of truth, grouped notation grid, dheergam + legato playback, settings parity. The app now has four tabs: LoopLab / Compose / Ragas / Varisai. Also fixed en route: v0.10.1 (build 17) — the LoopLab swara editor is a pushed page, not a cover (it oscillated open/close inside the fullscreen host). **TALA SHIPPED 2026-10-18 (v0.12.0, build 19, run 39125938959, 87/87 tests)** — TalaSpec in RagaCore, SineClickEngine in AudioKit, Tala package with the wheel (exact web geometry), lookahead click scheduler, tap tempo and validated settings. ALL FIVE web studios are now native (five tabs). **PARITY COMPLETE 2026-10-18: P6 SHIPPED as v1.0.0 (build 20, run 39133998922, 90/90 tests)** — lock-screen remote controls, cross-studio audio focus, Varisai seam loop toggle, README. **v1.0.1 (build 21, run 39136033431, 92/92)** fixed his on-device finds: Varisai highlight performance and the exact v14 piano geometry. The native app is at full parity with the web suite; what remains is his on-device acceptance pass (the ear tests) and the audit's fix batches A + B shipped as v1.1.0 build 22 the same day (run 39139403742, 92/92) — chip wrap, render isolations, loops chip collection with group arming, fullscreen narrowing, and the web's waveform colour bands. **v1.1.1–v1.2.1** followed the same day (web-exact Loops/A–B order; Varisai flex grid; song-list → pushed SongDetailView navigation; Varisai ticker highlight + ctl-bar + laya box) and **v1.2.2–v1.2.4 shipped 2026-10-18 (build 30, run 39155048565, 96/96)**: waveform time + loop badges, pinned playback-section scrolling, icon-only Follow + Fit on the waveform corners, Compose push navigation and ＋-only new button, the shared editor's Play/Loop state fixes and red trash delete, and a flat All-72 melakarta list. Details in PARITY-PLAN.md. **SequencePlayer P-A (v1.4.0 build 35, run 39164051143, 107/107)**: shared playback core landed (TimelineIndex + SequencePlayer + two policies), no studio migrated yet; waveform touch-forwarding fix queued behind the migration. **v1.3.0–v1.3.3 (build 34, run 39157913550, 96/96)**: Varisai Practice Dock layout, background keep-alive for phrase loops, Varisai seam lead-in fix, Phrase-card header actions.
- **Unit**: seconds↔frames, loop clamp/swap, SHA-256 dedupe (same bytes → same song), persistence round-trip incl. notes
- **Prototype as oracle**: every MVP interaction has a working web reference — behavior-parity checklist before 1.0
- **Device (real iPhone)**: 0.25x listen test by ear, gapless loop seam, pinch/pan gestures, background + lock, call interruption, headphone unplug, airplane mode (all offline)
- **TestFlight**: 2–3 musician testers — "loop a 5-second phrase at 0.25x for 10 minutes — what annoyed you?"

---

## 14. Milestones & rough effort (solo, part-time)

| Milestone | Scope | Rough effort | Status |
|-----------|-------|--------------|--------|
| M1 | Scaffolding, import + SHA-256 dedupe, basic transport, library UI | ~1 week | DONE 2026-10-17 (CI green, v0.2.0) |
| M2 | **Audio engine spike**: 0.25x time-pitch quality, position math, gapless segment loop — prove before UI | 3–4 days | DONE 2026-10-17 (CI; seam quality is an on-device ear test) |
| M3 | A–B loops: set/select/toggle, 0.1s nudge, rename/delete, per-loop notes | ~1 week | DONE 2026-10-17 (CI) |
| M4 | Persistence/restore (position, selection, notes), delete flows | 3–4 days | DONE 2026-10-17 (CI) |
| M5 | Waveform: peaks job + inline rendering + fullscreen zoom/pan/follow + chips + floating panel | ~1.5 weeks | DONE 2026-10-17 (CI) |
| M6 | Interruptions, background, edge cases, TestFlight | ~1 week | DONE 2026-10-17 (CI; sideload distribution instead of TestFlight) |

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
