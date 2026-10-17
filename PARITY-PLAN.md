# RagaMentor — Native Parity Plan

**Status:** Approved direction, 2026-10-17 (Shahzin). Architecture approved the same day. **P0 SHIPPED 2026-10-17 as v0.7.0** (CI run 39061586074, both jobs green, 25/25 tests; IPA 765,481 bytes on the `latest` release).
**Goal:** the native iOS app reaches full feature parity with the web suite, with the UI matched closely to the web, while keeping the native advantages (native audio engine, true background playback, real on-device files, OS interruption handling).
**Companion doc:** `PLAN.md` (the MVP plan, M1–M6, shipped as v0.6.0). This plan supersedes the PLAN.md §15 parking-lot closure for the items listed here.
**Evidence base:** full source inventories of all five web studios + the shared modules, taken 2026-10-17, and a full run of the web test suites (16 suites, 795 counted assertions, all passing). The inventories are the parity checklists: every rule in them becomes a checklist item in the milestone that ports it.

---

## 1. Principles

1. **Parity means behaviour, not screenshots of code.** Every user-visible rule in the web source (ranges, clamps, defaults, ordering, edge cases) is reproduced. Web bugs that are invisible to users (dead selectors, stale description text) are not reproduced; web quirks that change what a user hears or sees are flagged as decisions in §8, never silently changed.
2. **Protocol-oriented, modular design.** One Swift Package per module. Features depend on protocols, never on each other. Pure logic sinks to RagaCore and is testable without UI or audio.
3. **One shared editor, one shared store.** The web's two copy-paste couplings (the transplanted swara editor, the mirrored favourites key) become a single SwaraEditor module and a single RagaLibrary store.
4. **Tests translate with the features.** Each web suite maps to a named native test target (§6). Coverage gaps on the web (Tala, RagaBrowser runtime, Varisai playback) get new native suites, written to the same standard.
5. **Native advantages are kept, not traded away.** Sample-accurate gapless looping, background audio, Now Playing, Files integration, SHA-256 dedupe and real file storage stay as they are in v0.6.0.

---

## 2. Parity scope, studio by studio

### 2.1 Launcher (web: `site/index.html`)
Home screen with one card per studio. Native AppShell mirrors this: the same five cards, same order, above nothing else. Native LoopLab's "now playing above library" home stays inside the LoopLab feature, as on web.

### 2.2 LoopLab (web: `prototype/index.html`, 2,657 lines)
Already largely shipped in v0.6.0 (PLAN.md M1–M6). The parity deltas are:
- **Swaras** (§2.3) — the one missing feature block.
- **Loops JSON v3 compatibility.** Web exports `{app:"RagaMentor", version:3, …}` with file-local serial ids, loops sorted by start, `swaras` additive per loop. Native backup is v1 today. Parity: native reads and writes v3 (including phrases), and still reads v1 files.
- **Micro-rules to verify against the inventory**, including: selecting a song resets speed to 1 (not stored per song); Add-loop starts playback if paused and the new loop joins the open group; tapping the selected loop's chip again deselects it; loop badge tap = restart at range start; A–B tab with a group selected lets the playhead roam (no wrap) while a selected loop keeps wrapping; name fields cap at 40 chars; split point = playhead rounded to 0.1s, second name bumps the trailing number then unique-ifies.
- **No repair flow.** The web's broken-song repair (re-import matched by title + file size) exists because IndexedDB loses audio bytes. Native stores real files; the failure mode does not exist. Dedupe on re-import already covers the user intent.
- **Peaks stay native-style**: persisted sidecar cache (web recomputes 6,000 buckets per selection; native's cache is strictly better and invisible to the user).

### 2.3 LoopLab Swaras + the swara editor (web: transplanted Compose editor)
- One phrase per loop, stored on the loop record. Phrase = `{ragaId, saOffset, tempo, loop, chips[]}`; chip = note (stack of `{st, oct}` / `{hold}` entries) or hold or gap, beats 0.25–8 in 0.25 steps. New-phrase defaults: song's remembered raga (else Mohanam), Sa offset 0, tempo 72, loop off.
- Loops-tab section: empty state with ＋ Add; filled state shows a read-only chip strip, round play button, Edit, tempo slider (30–120), meta line; loops with phrases carry a ♪ marker on their chips.
- Composer (full-screen): Setup card (raga dropdown, Sa dropdown, tempo slider, Play/Stop, Loop toggle, JSON mode, Delete swaras), Phrase card (chip strip + append), auto-save on every edit, Done only closes. Emptying a never-saved phrase leaves it unsaved; emptying a saved phrase saves an empty phrase.
- Picker (bottom sheet): note grid = the raga's arohana ∪ avarohana (arohana order first) or all 16 sthanas when Chromatic; octave segment (low/middle/high); specials row (hold / gap / clear); length stepper 0.25–8 in 0.25 steps, fraction labels ¼ ½ ¾; stack mode with ordered selection, removable chips, Done (disabled when empty); insert-before/after popover in edit mode.
- Playback semantics (the heart of the port; identical in Compose): a stack subdivides its own chip duration equally over **all** entries, holds included; an in-stack hold adds a share to the preceding sub-note; a hold chip (or all-hold stack) extends the pending note, and the accumulated extension lands **entirely on the final unit** of the preceding chip; a gap chip closes the event and advances in silence. Sound per note = slice + min(0.28, slice × 0.7), played through the equal-power crossfaded sustain chain. Song playback and phrase playback are mutually exclusive (starting one stops the other). Tempo/Sa/raga changes restart a playing phrase.
- Octave rendering: combining dot U+0307 above / U+0323 below the letter; variant digit as subscript.

### 2.4 Compose Studio (web: `compose/index.html`)
- List view (sorted by updatedAt desc; row = play button, name, `raga · beats · tempo · date` meta) + editor view. Storage shape `{compositions:[…]}` with fields `id, name, ragaId, saOffset, tempo (30–120), loop, chips, createdAt, updatedAt`. New composition defaults: Mohanam, Sa 0, tempo 60, empty chips.
- The editor is the **same SwaraEditor module** as §2.3 (picker, stack mode, insert popover, length stepper, raw-JSON mode). Raw JSON prints header fields then one chip per line; Apply runs the full sanitizer before saving anything.
- Export envelope written exactly: `{app:"Compose Studio", version:1, kind:"composition", composition:{name, ragaId, saOffset, tempo, loop, chips}}`. Import never overwrites (fresh id every time) and — parity note — the web sanitizer does **not** check the envelope fields; it accepts a bare composition object too. Native import matches that behaviour.
- Sanitizer rules (shared with phrases): invalid beats snap to 1; a note chip with an empty stack or an unknown sthana rejects the whole input; `oct` forced to 0 unless exactly −1/0/1; unknown `ragaId` → null (Chromatic); `saOffset` integer 0–11 else 0; tempo `+tempo || 60` then clamped 30–120.
- List-row play buttons play the phrase (editor-only looping; list playback never loops). Row play toggles; only one playback at a time.

### 2.5 RagaBrowser (web: `raga/index.html`)
- Data: **87 ragas** — 72 melakartas (`mel001`–`mel072`, chakra computed from number, 12 chakras × 6), 4 Carnatic janyas (Mohanam, Hamsadhvani, Abhogi, Hindolam), 11 Hindustani grouped by 7 thaats. Fields: `id, name, aro, ava, allied` (names), plus `num/chakra/jati` (melakartas), `mel` (janyas), `sys/thaat` (Hindustani).
- Four tabs (bottom tab bar): **Search** (name substring + swara-chip AND search over aro ∪ ava, 12 collapsed pitch classes; empty query shows the instructional empty state, not a list), **Favourites** (insertion order), **Melakartas** (M1 1–36 / M2 37–72 / All 72 segments; chakra accordion, one open at a time), **Hindustani** (thaat groups, all open).
- Detail: hero + meta line; scale card with Carnatic/Hindustani notation toggle (auto-set by system, not persisted); Listen card — Sa dropdown (12), one Play button playing arohana + avarohana as a single sequence, tempo slider **30–240 step 10, default 120**; allied-ragas pills (name-resolved; unresolvable entries skipped); Lakshana card stays a placeholder, as on web.
- **Piano is display-only on web** (v14): a rel −1…13 strip, in-scale keys tinted and labelled (Sargam or Western per label mode), playback highlight synced to chips. Keys do not respond to taps. Parity = display-only; a tappable piano is an enhancement beyond parity (§8).
- **Timbres: only harmonium is user-facing on web.** The vocal formant synth is fully coded but unreachable (no selector exists); choir and AI voice appear only in the licence line — no assets, no code paths. Parity scope is therefore harmonium (12 samples C4–C5, F♯4 absent, nearest-sample + playback-rate shift). The vocal synth is an optional add (§8).
- Favourites: star on every card and in the detail hero; one store (native RagaLibrary) replaces the web's `raga-favs` + `raga-fav-data-v1` mirror.
- Pick mode: banner + "✓ Use this raga" on the detail page; same-origin return check on web becomes, natively, an in-app typed contract (§3, RagaPicker).
- Sample licence: harmonium = tonejs-instruments, CC-BY 3.0 — attribution line ships in the app (web shows it in the Listen card).

### 2.6 Tala Studio (web: `tala/index.html`)
- Wheel: SVG 280×280, one dot per akshara at radius 108, groups separated by fixed 0.10 rad gaps, dot radius clamp(300/N, 4.5, 11); samam dot gold; active dot accent-filled; centre shows the combination name; line below shows the anga formula + akshara count. **Display only — no wheel interaction.**
- Coverage: 7 suladi sapta talas (Dhruva L D L L · Matya L D L · Rupaka D L · Jhampa L A D · Triputa L D D · Ata L L D D · Eka L) × 5 jatis (Tisra 3, Chatusra 4, Khanda 5, Misra 7, Sankeerna 9) + Misra Chapu (7) and Khanda Chapu (5) fixed. Cycle lengths 3–29 aksharas. Triputa + Chatusra displays as **Adi** (gold). Chapu selection disables the jati chips (value retained).
- Controls: tempo 30–120 step 1 (default 60, live change, no cycle reset); tap tempo (taps within 2500 ms, last 6, ≥2 required, result clamped 30–120); subdivision segmented 1/2/3/4 per beat labelled 1st speed / 2nd speed / Tisra / Chatusra (default 4; changing it mid-play keeps the beat and the clock, resets only the subdivision index); Start begins at beat 0 with first sound at +0.08 s; changing tala/jati while playing restarts the cycle (already-scheduled clicks inside the lookahead still sound).
- Engine: lookahead scheduler, 25 ms tick, 0.15 s window; synthesized clicks — samam 1320 Hz @ 0.55, beat 880 Hz @ 0.45, subdivision 660 Hz @ 0.22; envelope to 0.001 at +0.06 s, stop at +0.09 s. Anga boundaries have no distinct sound.
- Settings `{talaId, jatiId, bpm, nadai}` validated on load (bpm 30–120, nadai 1–4, ids must exist); a stored v1 `talaId:"adi"` migrates to Triputa + Chatusra. Page always loads stopped. Native keeps the same defaults and validation; native adds background-capable playback as an advantage, not a behaviour change.

### 2.7 Varisai Studio (web: `varisai/index.html` + `lessons.js`)
- Catalogue: **7 lessons, 50 patterns, 3,914 note tokens**, Mayamalavagowla only, no raga selector. Sarali 14, Janta 12, Dhattu 2, Sapta Tala Alankarams 7, Sthayi: Mandhra 5, Madhya 5, Mel 5. List order by lesson number (Mandhra → Madhya → Mel). Data source of truth is the mock repo's `LESSONS` (standing rule); the shipped `lessons.js` matches it and the port verifies counts against both.
- Data shape per pattern: `title`, `sub`, `notes` (flat token array = playback source), `dlines` (grouped display; flattened `dlines` equals `notes` for all 50 — an invariant the ported data tests assert), optional `laya` (24 patterns) or `tala` (7 alankarams), never both.
- Grouping: Sthayi 4-per-group (user decision); Alankaram groups follow the tala angas from the `|` bars; Dhattu alternates 2,2,2,2 (Part 1) and 4,4 (Part 2) lines; Sarali/Janta groups follow the laya digits. Two-part laya: Part 1 = odd lines, Part 2 = even lines.
- Notation: `,` token = dheergam hold (extends the previous note one step; 278 occurrences); `-` exists only inside laya strings (logical separator, never a rest, never displayed); upper octave = apostrophe in data, re-appended in labels; lower octave = combining dot U+0323 after the first letter + dashed chip border. Label modes: simple (S R G, digits stripped; **default**, a stored "full" is respected) / full (S R₁ G₃).
- Laya/Tala info block: laya boxes per StudioUI rules (hyphens never shown, parenthesised hints stripped); alankaram tala shown verbatim per anga with the beat-math line (`4 + 2 + 4 + 4 = 14 beats`) and the tappable coachmark legend (Laghu / Drutam 0=2 / Anudrutam U=1).
- Playback: step = (60/tempo)/speed; speeds 1/2/4/8 (default 2); tempo slider **30–90 step 10** (default 60); Sa dropdown 12 (default C); dheergam extends the previous note; legato overlap — 8x: max(2.0, 0.25/step), 4x: 1.8, 1/2x: 1 + min(1.5, 0.075·speed/step); sounding duration floor = max(soundDur × 0.96, step × overlap); seamless loop = next pass at exactly t0 + notes × step (timer fires 60 ms early), loop default ON, not persisted; restart-on-change: Sa/Speed immediate, Tempo after 350 ms debounce, Labels re-render only. Highlight = one chip at a time, in flattened order.
- Settings are global (not per-lesson): Sa, tempo, speed, labels, theme. No lesson/pattern position is stored. The "🎤 Sing back (soon)" button is a disabled placeholder on web — parity omits it (it advertises a feature that does not exist).

### 2.8 Out of parity scope (explicit)
Streaming/DRM sources, pitch shift, recording, cloud sync (PLAN.md §2, unchanged). Web placeholders with no function (Lakshana data, sing-back, choir/AI-voice timbres) are not features and are not ported as features.

---

## 3. Architecture (approved 2026-10-17)

Local Swift Packages, one per module, so boundaries are compiler-enforced and every module carries its own test target. Dependencies point down only; features never import each other.

```
        AppShell (launcher, navigation, DI) — imports all features
   ┌────────┬──────────┬────────┬───────────┬──────────┐
 LoopLab   Composer    Tala   RagaBrowser  Varisai   (features)
   └────────┴────┬─────┴────────┴───────────┴──────────┘
        SwaraEditor (shared editor UI + logic — Composer AND
                     LoopLab-Swaras both depend on it)
   ┌────────────┬──────────────┬───────────────┐
 AudioKit    PersistenceKit   DesignSystem  +  RagaLibrary (service)
   └────────────┴──────┬───────┴───────────────┘
                    RagaCore (domain types, protocols, pure logic,
                              raga registry data — no UI, no audio)
```

### 3.1 Module contents

- **RagaCore** — value types: `Swara` (16 sthanas + semitone map, enharmonic sharing as coded on web), `Raga` (id, name, aro, ava, allied, system fields), `Phrase` / `Chip` / `StackEntry` (the chip model of §2.3), `TalaSpec` (anga sequences, jatis, chapus), `Lesson` / `Pattern`. Pure logic: phrase event expansion (stack subdivision + hold rules), sanitizers (phrase + composition), scale-signature computation and pick resolution, picker-list derivation (arohana ∪ avarohana ordering), tala cycle math (akshara counts, Adi special case), varisai token parsing and legato-overlap computation, checksum-free data tables. The 87-raga registry and the curated 10-raga editor table ship here as data. The varisai lesson dataset ships as data in the Varisai feature (it is feature data, not domain logic), generated from the mock source of truth.
- **AudioKit** — three protocols with AVAudioEngine implementations and test fakes:
  - `FilePlaybackEngine` — today's AudioEngine (file load, TimePitch rate, gapless segment loop, position stream, offline-render harness).
  - `ToneEngine` — sampled/synth note playback: sample library (the 12 harmonium files, nearest-sample + rate-shift rule), `playSampled` envelope (attack 0.02 s to 0.9, hold to dur − 0.12 s, release to dur + 0.15 s), the equal-power crossfaded sustain (`playSampledSustain` semantics: chain segments while combined gain ≈ 1; crossfade = min(0.8 s, 20% of sample length)), synth fallback tone.
  - `LookaheadScheduler` — a shared clock service (25 ms tick, 0.15 s window) driving Tala clicks and available to phrase playback highlight sync. Click synthesis (1320/880/660 Hz tiers) lives in the Tala feature on top of it.
  One `AVAudioSession` owner in AudioKit coordinates the file engine and tone engine so the mutual-exclusion rule (song vs phrase) and interruption handling are implemented once.
- **PersistenceKit** — protocols `SongStore`, `PhraseStore` (compositions), `SettingsStore`. SwiftData for songs/loops (today's models, moved), Codable file store for compositions, a settings store whose keys deliberately mirror the web's (§5) so behaviour — including what is *not* persisted — matches.
- **DesignSystem** — the web's `studio.css` tokens as SwiftUI: colours for both themes (including the samam gold, per-theme variants, group palette `#2dd4bf #fbbf24 #a78bfa #fb7185 #38bdf8`, loop tint alphas), typography, and the `StudioUI` component set: segmented control, tempo slider, Sa selector, chip grid, grouped grid (flex-proportional groups), laya display, tala display, coachmark popover. Also the phrase chip renderer (stack labels with combining-dot octave marks and subscript digits) and the current-chip highlight style (`panel2 78% / accent 22%` tint + accent border + 2 px outline) — one implementation used by the editor, the Swaras section, and Varisai.
- **RagaLibrary** — the shared raga state service (protocol in RagaCore, store in PersistenceKit): Recents (MRU, cap 5, global), Favourites (id set + insertion order), personal registry (`rb-<slug>` ids, `src: pick|fav`, signature resolution delegated to RagaCore), per-song raga memory (`songRagaId`, default Mohanam). RagaBrowser manages favourites; editors consume. There is no mirror copy anywhere.
- **SwaraEditor** — the editor as a reusable module: setup card (raga selector fed by RagaLibrary, Sa selector, tempo), phrase strip, picker sheet (grid, octave segment, specials, length stepper, stack mode, insert popover), raw-JSON mode. Hosts provide a `PhraseHost` protocol: where the phrase lives (a loop, a composition), what "song context" means for raga memory, and how playback interlocks. This replaces the web's transplant with one implementation and two hosts.
- **RagaPicker** — a protocol in RagaCore: `pickRaga(from:current:) async -> Raga?`. Implemented by the RagaBrowser feature (pick mode UI), invoked by any editor through the AppShell's navigation. The web flow's rules become contract: pick resolves by scale signature → curated table, else name, else registry entry; the result is recorded in Recents and the host's raga memory; a cancelled pick changes nothing. (The web's 10-minute freshness and consume-once rules exist only because the web flow crosses page loads; natively the value returns directly, so those rules are represented as contract tests on resolution and recording, not as timestamps.)
- **Features** — LoopLab (incl. its Swaras section as a SwaraEditor host), Composer (the other host), Tala, RagaBrowser, Varisai. Each feature owns its views + view models and depends only on RagaCore, AudioKit, PersistenceKit, DesignSystem, RagaLibrary — and, for editors, SwaraEditor.
- **AppShell** — launcher home mirroring the web launcher, one navigation stack, theme (a **single** unified setting; the web inconsistently uses three theme keys — `slowloop-theme`, `varisai-theme`, `ragamentor-theme` — native unifies them, an invisible improvement), dependency injection by constructor, Now Playing / interruption coordination via AudioKit.

### 3.2 Rules that keep it scalable
1. No feature imports a sibling feature. Cross-feature = protocol service (RagaLibrary, RagaPicker) or shell navigation.
2. Every service is a protocol; every feature's view models take protocols in init, so tests inject fakes (this fixes v0.6.0's untestable concrete PlaybackController dependency).
3. Pure logic has no dependency beyond Foundation. If a rule can be stated without UI or audio, it lives in RagaCore and is unit-tested there.
4. Data ships as data (registry, lessons, tala tables), validated by data tests, never as code branches.
5. The pbxproj gains one `XCLocalSwiftPackageReference` per package; the app target links package products. The known hand-written-pbxproj gotchas (quoted values, SDKROOT/SUPPORTED_PLATFORMS, classic route for test targets) apply; CI verifies from the first P0 commit.

---

## 4. UI parity approach

- **Tokens first.** DesignSystem is built from `studio.css` values before any feature screen is ported, so screens match by construction: same accent, panel tints, group palette, samam gold (dark `#ffd166` / light `#d99a17`), chip styles, and the current-chip highlight tint.
- **Same information architecture.** Launcher cards in web order; LoopLab home = player card above library, no loop UI at home; fullscreen panel with Loops / A–B / More tabs and persistent mini-transport; Compose list → editor; RagaBrowser bottom tab bar with the same four tabs; Tala single column with the wheel card first and a fixed bottom Start bar; Varisai list → player with the same control row (Sa / Speed / Labels) and tempo slider.
- **Same control vocabulary.** Segmented controls, tempo sliders with the web's ranges per studio (they differ: Compose/Swaras 30–120 step 1, RagaBrowser 30–240 step 10, Varisai 30–90 step 10, Tala 30–120 step 1), Sa dropdowns (12 options, C…B), the ¼ ½ ¾ fraction labels, ■ (U+25A0) as the stop glyph in play buttons.
- **Geometry where it is the feature.** The Tala wheel reproduces the web's layout math exactly (radius 108/280, 0.10 rad group gaps, dot radius formula). The waveform keeps the web's band/tint layering (group bands by depth, then loop tints, then peaks, A/B dashed markers, red playhead) on the native renderer.
- **Native idiom where the web was constrained.** Sheets instead of DOM overlays (same z-order semantics: picker above composer above fullscreen), haptics on the A/B swap (already native), Files app for import/export, share sheet for JSON export. No screen gains or loses a control in translation.

---

## 5. Data model & migration

### 5.1 Storage mapping (web → native)
| Web | Native |
|---|---|
| IndexedDB `slowloop-proto` songs record (audio bytes inline, loops, groups, swRagaId) | SwiftData `Song` / `LoopRegion` / `LoopGroup` + audio file in Application Support (already shipped; `swRagaId` added in P1) |
| `compose-studio-v1` | `PhraseStore` Codable file (same shape) |
| `tala-settings` `{talaId, jatiId, bpm, nadai}` | `SettingsStore` (same fields, same validation, same `adi` migration) |
| `raga-favs` + `raga-fav-data-v1` mirror | RagaLibrary favourites (single store) |
| `raga-registry-v1`, `raga-recents-v1` | RagaLibrary registry + recents |
| `raga-sa`, `raga-label-mode`, `raga-tempo` | `SettingsStore` (RagaBrowser) |
| `varisai-sa/tempo/speed/labels` | `SettingsStore` (Varisai; tempo slider's own key becomes a settings field) |
| `slowloop-last` | Song store: last-open song id (already shipped) |
| three theme keys | one unified theme setting |
| `ragabrowser-pick-v1`, `raga-resume-v1` | not stored — typed `RagaPicker` return value |

### 5.2 Web → native content migration (one-time imports)
- **Loops**: P1 teaches the native backup the web's v3 format (read + write, phrases included). A user exports from web LoopLab and imports in native LoopLab; loops, groups, notes and phrases land intact. Native v1 files remain readable.
- **Compositions**: P2's import accepts the web Compose export envelope (and bare composition JSON, matching the web sanitizer). Web compositions import from Files with fresh ids.
- **Favourites/recents**: no file format exists on web; they start fresh natively. (The registry/favourites are small and rebuild in normal use; a migration path is not worth a format.)

---

## 6. Test translation

### 6.1 Baseline (measured 2026-10-17, all passing)
16 web suites, **795 counted assertions** + `repro-test.js` (no counter), classified by the native test style each one needs:
- **(a) Pure logic / data** — 3 suites, 558 assertions: varisai data (533), split (16), raga-browser static checks (9).
- **(b) Audio perceptual** — 1 suite, 17 assertions: sustain (equal-power crossfade).
- **(c) DOM / UI interaction** — 10 suites, 192 assertions + repro: backbtn (8), checklist-top (14), newloop (11), newloop-top (8), pause-tap (6), roam (4), subgroup-check (7), compose (65), swaras (69), repro (—).
- **(d) Storage round-trip** — 2 suites, 28 assertions: roundtrip (11), raga-link (17).

Translation rule: bucket (a) ports as unit tests over RagaCore/data with the same assertions restated; (b) ports to the AudioKit offline-render harness asserting the same perceptual quantity (combined gain ≈ 1 across the crossfade, fadeIn² + fadeOut² ≈ 1); (d) ports to PersistenceKit round-trip tests; (c) ports to view-model tests with fake engines/stores — the *behaviour* asserted (labels, candidate lists, state transitions) is kept, the DOM mechanics are not. Assertions that only check "the page booted with zero JS errors" have no native analogue beyond an app-launch smoke test in the AppShell target.

### 6.2 Per-suite mapping
| Web suite (assertions) | Native target | Bucket | Notes |
|---|---|---|---|
| varisai-data (533) | Varisai data tests | (a) | Same checks over the ported dataset, incl. `dlines` flat == `notes` for all 50 patterns. Data generated from the mock source of truth; test reads the shipped data file. |
| split-test (16) | RagaCore loop-ops tests | (a) | Naming bump + unique-ify, note copied, phrase stays on first piece, group slot/order preserved. Already partly covered by v0.6.0 tests; restated in package target. |
| raga-browser-test (9) | RagaCore registry + RagaPicker contract tests | (a) | Source-string checks become data/contract checks: registry counts (72/4/11), pick payload shape, resolution rules. |
| sustain-test (17) | AudioKit render tests | (b) | Offline-render the sustain chain; assert combined gain ≈ 1 and segment timing, as the web asserts on its mock graph. |
| roundtrip-test (11) | PersistenceKit backup tests | (d) | v3 export → import: fresh ids, duplicate names survive, byte-stable second export, garbage rejected. Extends the v0.6.0 v1 tests. |
| raga-link-test (17) | RagaLibrary tests | (d) | Favourites bridge → registry, recents order + cap, signature pick (melakarta 29 → Shankarabharanam, no registry entry), unstar removes `src:fav` but keeps `src:pick`. |
| backbtn (8) | LoopLab view-model tests | (c) | Destination-labelled back (`‹ Pallavi`, `‹ All`), back selects + arms the parent. |
| checklist-top (14) + subgroup-check (7) | RagaCore group-ops + LoopLab view-model tests | (c)/(a) | Candidate rules per entry mode (top-level, open Add, new sub-group). The candidate computation is pure → RagaCore; the flow states → view model. |
| newloop (11) + newloop-top (8) | LoopLab view-model tests | (c) | New-loop flow: context kept/cleared, tab switch, group join vs ungrouped, chip order. |
| pause-tap (6) | LoopLab view-model tests | (c) | Tap semantics: playhead moves, arm state set, play/pause untouched in both states. |
| roam (4) | LoopLab view-model tests | (c) | A–B tab + group selected = no wrap; Loops tab reinstates bounds. (Native engine-level wrap is already render-tested; this covers the arm-state rule.) |
| compose-test (65) | SwaraEditor + Composer tests | (c)+(a) | Sanitizer subset → RagaCore; view switching, creation defaults, row play, raw-JSON apply → view-model tests. |
| swaras-test (69) | SwaraEditor + LoopLab tests | (c)+(a) | Section states, ♪ marker, tempo mirroring, Add/Edit/Delete flows, stack Done, length stepper, stop-keeps-Play-look, phrase sanitizer subset → RagaCore. |
| repro-test (—) | AppShell smoke test | (c) | One launch + navigate smoke test per feature replaces the page-boot gate. |

### 6.3 Coverage gaps on web → new native suites (no source suite to translate)
- **Tala** (no web tests): RagaCore tala-math tests (cycle lengths for all 35 sapta combinations + 2 chapus, Adi naming, settings validation + `adi` migration) and scheduler tests against a fake clock (lookahead advances, tier selection per slot, subdivision change keeps the beat).
- **RagaBrowser runtime** (web has static checks only): search tests (name substring, swara AND semantics, empty-state rule), chakra grouping tests (computed assignment, accordion rule), detail playback sequencing tests against a fake ToneEngine.
- **Varisai playback** (web tests data only): event-timing tests over the ported expansion (dheergam extension, legato overlap per speed, seamless loop pass length, restart-on-change rules) with a fake ToneEngine + fake scheduler.

### 6.4 CI
Every package is a test target in the existing fastlane `test` lane; the suite is green only when all targets pass. Counts are reported per milestone in the release notes of each version, against the translated baseline above (795 web assertions is the reference, not a quota — native suites restate behaviours, and the three gap areas add new ones).

*As built in P0 (2026-10-17):* the suites run in the app's test target, organised as one file per module — RagaCoreTests (17), AudioKitTests (4), PersistenceKitTests (1), LoopLabTests (2), AppTests (1) — each importing its package, through the existing fastlane simulator lane. Package-local SwiftPM test targets were not needed to get per-module suites; they can be introduced later without changing the tests. Two build lessons from P0: a SwiftData `ModelContainer.mainContext` access is @MainActor-isolated and cannot sit in a non-isolated store property; and the AppShell target must link the full package graph directly (AudioKit + RagaCore included), because public default arguments (e.g. `PlaybackController.init(engine:)`) make the shell reference lower-module symbols at link time.

---

## 7. Milestones

Sequence note: P1/P2 build the editor stack; P3 completes the raga loop (browser + picker). P4 (Tala) and P5 (Varisai) are independent of the raga stack and of each other; their order can swap without cost. Rough efforts assume solo, part-time, CI-verified per milestone, same cadence as M1–M6.

| ID | Scope | Version | Rough effort |
|---|---|---|---|
| **P0** ✅ | **Modular refactor.** Split v0.6.0 into packages (RagaCore, AudioKit, PersistenceKit, DesignSystem shell, LoopLab feature, AppShell). Extract protocols (`FilePlaybackEngine`, `SongStore`, `SettingsStore`); PlaybackController becomes the LoopLab view model over protocols with fakes. All 25 existing tests move to package targets and stay green. **Launch-screen fix rides along** (LaunchScreen + config), ending the compatibility-size display. | v0.7.0 | ~1 week |
| **P1** | **RagaLibrary + SwaraEditor + LoopLab Swaras.** Phrase model + expansion + sanitizers in RagaCore; ToneEngine (samples + sustain) in AudioKit; RagaLibrary service; SwaraEditor module; LoopLab hosts it (§2.3); per-song raga memory; loops backup learns **v3** (read/write, phrases) — the web→native loops migration lands here. RagaPicker protocol defined; until P3, the picker contract is served by RagaBrowser's future module, so the editor's "RagaBrowser ›" entry is present but routes to a registry browse sheet inside the editor (same data, interim UI) — replaced by the real browser in P3. Tests: swaras (69) + raga-link (17) translations. | v0.8.0 | ~1.5 weeks |
| **P2** | **Compose Studio.** Composer feature: list + editor (SwaraEditor host #2), envelope export/import (§2.4), raw-JSON mode parity. Tests: compose (65) translation. | v0.9.0 | ~1 week |
| **P3** | **RagaBrowser.** Registry data port; four tabs; detail (notation toggle, Listen card, piano display); favourites into RagaLibrary; **RagaPicker goes live** — editors' "RagaBrowser ›" now opens the real browser in pick mode. Tests: raga-browser (9) translation + new runtime suites (search, chakra, detail sequencing). CC-BY attribution line in the Listen card. | v0.10.0 | ~1.5 weeks |
| **P4** | **Tala Studio.** TalaSpec in RagaCore; LookaheadScheduler in AudioKit; wheel view (exact web geometry) + controls + settings with validation and `adi` migration. Tests: new tala suite (§6.3). | v0.11.0 | ~3–4 days |
| **P5** | **Varisai Studio.** Lesson dataset generated from the mock source of truth into a data file; grouped-grid display (DesignSystem), laya/tala blocks + coachmark; playback with dheergam + legato rules via ToneEngine + scheduler; settings parity. Tests: varisai data (533) translation + new playback suite (§6.3). | v0.12.0 | ~1 week |
| **P6** | **Parity hardening → 1.0.** Line-by-line checklist pass of every studio against the 2026-10-17 source inventories; launcher/theme polish; lock-screen remote controls (the native advantage left from the MVP list) if not already landed; full-suite CI run; on-device acceptance pass per studio (the ear tests CI cannot do: sustain quality, loop seam at phrase boundaries, Tala click feel, Varisai legato at 8x). | v1.0.0 | ~1 week |

**Total: roughly 7–8 weeks part-time.**

### Acceptance per milestone (all must hold)
1. CI green: build + every package test target, including the milestone's translated suites.
2. The milestone's inventory checklist (§2) verified item by item; any deliberate deviation is written into this plan as an amendment, not shipped silently.
3. IPA published to `latest`; on-device spot check by Shahzin for the milestone's headline flow.

---

## 8. Risks & open decisions

1. **R3 semitone quirk (decision, default: replicate).** RagaBrowser's semitone map codes `R3: 2`, colliding with R2/G1 (conventional sthana value 3). Melakartas 61–72 use R3, so web playback frequencies and piano positions follow the coded value. Default: port the map as coded (audible parity), and record the quirk in RagaCore next to the table. Changing it later is a one-line data change plus a plan amendment.
2. **Vocal formant synth (optional add, default: out).** Fully coded on web but unreachable — no UI selects it. Porting it into ToneEngine is cheap (one synth voice), but it is not parity. It lands only on an explicit ask, as a timbre selector in RagaBrowser (which would itself be a UI change needing design approval).
3. **Tappable piano (default: out).** Web keys are display-only. Making them play is an enhancement, not parity; it needs a design pass (it changes the Listen card's contract).
4. **Allied-raga data quirk (default: fix in data).** One Hindustani allied entry is an id (`bhairav_h`), not a name, so its chip never renders on web. The port resolves allied by id-or-name; the invisible fix makes one chip appear that web never showed. Noted here so the difference is a decision, not a surprise.
5. **Janta description text (default: fix text).** Shipped `lessons.js` describes Janta as "8 patterns"; the data has 12 (the tests assert 12). The ported data carries the corrected description.
6. **Sample asset.** The 12 harmonium MP3s (C4–C5, no F♯4) ship in the app bundle (~small). CC-BY 3.0 attribution is included in the RagaBrowser Listen card and an About line. No other web audio assets exist (choir/AI voice have none), so there is no other licence exposure.
7. **Hand-written pbxproj + packages.** Local package references in a hand-maintained project file are the main P0 mechanical risk; the mitigation is the established one — small commits, CI verdict per commit, quoted values throughout.
8. **Scope discipline.** Anything not in §2 is out, however small it looks; additions go through the normal design-confirmation rule and a plan amendment.

---

## 9. What "done" means

Parity is done at v1.0.0 when: every §2 behaviour is present natively; the translated suites (§6.2) plus the new gap suites (§6.3) are green in CI; a web export (loops v3, composition envelope) imports cleanly into the native app; and Shahzin's on-device pass confirms the ear-level behaviours (sustain, seams, clicks, legato) match what the web versions do — with the native advantages (background playback, real files, gapless engine looping) intact throughout.
