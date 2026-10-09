#!/usr/bin/env python3
"""Regenerate the Janta Varisai lesson in lessons.js from the shivkumar.org
janta-varisai PDF (see ../research/laya-patterns.md).

Transcription rules (Mayamalavagowla):
  s r g m p d n -> S R1 G3 M1 P D1 N3 ; S -> S' (upper octave)
  PDF ',' (dheergam) and '-' (gap) both -> '-' : the player sustains the
  previous note through '-', which is exactly a dheergam/karvai.
Slot templates index into per-line skeletons; '-' = rest slot.
Pattern 1: the PDF abbreviates ("s s r r | g g | m m / p p d d | n n | S S");
  rendered here as the complete doubled scale up and down (32 notes),
  matching the traditional first janta varisai.
"""
import re, json

LESSONS_JS = "lessons.js"

MAP = {'s': 'S', 'r': 'R1', 'g': 'G3', 'm': 'M1', 'p': 'P', 'd': 'D1',
       'n': 'N3', 'S': "S'", '-': '-', ',': '-'}

SKELETONS = [
    ['s', 'r', 'g', 'm'], ['r', 'g', 'm', 'p'], ['g', 'm', 'p', 'd'],
    ['m', 'p', 'd', 'n'], ['p', 'd', 'n', 'S'],
    ['S', 'n', 'd', 'p'], ['n', 'd', 'p', 'm'], ['d', 'p', 'm', 'g'],
    ['p', 'm', 'g', 'r'], ['m', 'g', 'r', 's'],
]
PLAIN = [0, 0, 1, 1, 2, 2, 3, 3]  # 11-22-33-44


def render(skel, template):
    return [MAP['-'] if t == '-' else MAP[skel[t]] for t in template]


patterns = []
# 1 — complete doubled scale (see docstring)
p1 = ["S", "S", "R1", "R1", "G3", "G3", "M1", "M1",
      "P", "P", "D1", "D1", "N3", "N3", "S'", "S'"] * 1
p1 = (["S", "S", "R1", "R1", "G3", "G3", "M1", "M1",
       "P", "P", "D1", "D1", "N3", "N3", "S'", "S'"] +
      ["S'", "S'", "N3", "N3", "D1", "D1", "P", "P",
       "M1", "M1", "G3", "G3", "R1", "R1", "S", "S"])
patterns.append(("Basic ascent / descent with janta",
                 "Doubled scale, up and down",
                 "11-22-33-44 (12-12-12-12)", p1))

# 2 — emphasis at each note: 10 explicit lines
p2 = []
for sk in SKELETONS:
    p2 += render(sk, PLAIN)
patterns.append(("Janta emphasis at each of the seven notes",
                 "Emphasis travelling up and down the scale",
                 "11-22-33-44 and 11-22-33-44 (12-12-12-12)", p2))

SPECIALS = [
    ("Zigzag janta (srgr-rgmg)", "Zigzag pairs, then plain repeat",
     "11-22-33-22 and 11-22-33-44 (12-12-12-12)", [0, 0, 1, 1, 2, 2, 1, 1]),
    ("Janta with single notes (ssr-ssr-sr)", "Single-note janta with gap",
     "112-112-12 and 11-22-33-44 (123-123-12)", [0, 0, 1, '-', 0, 0, 1, 0, 1]),
    ("Janta with single notes (ssrrg-srg)", "Single-note janta with gap",
     "11223-123 and 11-22-33-44 (12345-123)", [0, 0, 1, 1, 2, '-', 0, 1, 2]),
    ("Janta with dheergams (ss, -rr, -gg)", "Dheergam after each pair",
     "11,-22,-33 and 11-22-33-44 (123-123-12)", [0, 0, '-', 1, 1, '-', 2, 2]),
    ("Janta with dheergams (s,s -r,r -gg)", "Dheergam splitting each pair",
     "1,1-2,2-33 and 11-22-33-44 (123-123-12)", [0, '-', 0, 1, '-', 1, 2, 2]),
    ("Triple janta (sss-rrr-gg)", "Three of each swara",
     "111-222-33 and 11-22-33-44 (123-123-12)", [0, 0, 0, 1, 1, 1, 2, 2]),
    ("Dheergams at 1st and 3rd notes", "Dheergam line, then plain repeat",
     "1,23,-123 and 11-22-33-44 (12345-123)", [0, '-', 1, 2, '-', '-', 0, 1, 2]),
    ("Dheergams at 2nd and 3rd notes", "Dheergam line, then plain repeat",
     "12,3,-123 and 11-22-33-44 (12345-123)", [0, 1, '-', 2, '-', '-', 0, 1, 2]),
    ("Dheergams at 1st and 2nd notes", "Dheergam line, then plain repeat",
     "1,2,3-123 and 11-22-33-44 (12345-123)", [0, '-', 1, '-', 2, '-', 0, 1, 2]),
    ("Janta with dhatu jumps (ss mm gg rr)", "Jumping pairs, then plain repeat",
     "11-44-33-22 and 11-22-33-44 (12-12-12-12)", [0, 0, 3, 3, 2, 2, 1, 1]),
]
for title, sub, laya, special in SPECIALS:
    notes = []
    for sk in SKELETONS:
        notes += render(sk, special)
        notes += render(sk, PLAIN)
    patterns.append((title, sub, laya, notes))

# ---- verify ----
assert len(patterns) == 12, len(patterns)
sizes = [len(p[3]) for p in patterns]
expected = [32, 80, 160, 170, 170, 160, 160, 160, 170, 170, 170, 160]
assert sizes == expected, sizes
for _, _, _, notes in patterns:
    for n in notes:
        assert n == '-' or n.replace("'", "").replace(",", "") in \
            ('S', 'R1', 'G3', 'M1', 'P', 'D1', 'N3'), n
# spot-check against the PDF text
flat2 = patterns[1][3]
assert flat2[:8] == ["S", "S", "R1", "R1", "G3", "G3", "M1", "M1"]
assert flat2[32:40] == ["P", "P", "D1", "D1", "N3", "N3", "S'", "S'"]
flat4 = patterns[3][3]
assert flat4[:9] == ["S", "S", "R1", "-", "S", "S", "R1", "S", "R1"]  # ssr-s sr sr
flat6 = patterns[5][3]
assert flat6[:8] == ["S", "S", "-", "R1", "R1", "-", "G3", "G3"]  # ss,-rr,-gg
flat8 = patterns[7][3]
assert flat8[:8] == ["S", "S", "S", "R1", "R1", "R1", "G3", "G3"]  # sss-rrr-gg
flat12 = patterns[11][3]
assert flat12[:8] == ["S", "S", "M1", "M1", "G3", "G3", "R1", "R1"]  # ss mm gg rr
print("transcription verified:", sizes)

# ---- emit the lesson block ----
out = []
out.append('{')
out.append('  id: "janta", name: "Janta Varisai", num: 2,')
out.append('  desc: "12 patterns \\u00b7 janta sequences \\u2014 source: shivkumar.org janta-varisai PDF", raga: "Mayamalavagowla",')
out.append('  patterns: [')
for i, (title, sub, laya, notes) in enumerate(patterns, 1):
    notes_js = ", ".join(f'"{n}"' for n in notes)
    out.append(f'    {{ title: "{i} \\u00b7 {title}", sub: "{sub}", laya: "{laya}", notes: [{notes_js}] }},')
out.append('  ]')
out.append('}')
block = "\n".join(out)

src = open(LESSONS_JS).read()
start = src.index('{\n  id: "janta"')
end = src.index('{\n  id: "dhattu"')
new_src = src[:start] + block + "\n,\n" + src[end:]
open(LESSONS_JS, "w").write(new_src)
print("lessons.js updated")
