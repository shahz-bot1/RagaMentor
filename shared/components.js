"use strict";
/* RagaMentor shared UI components — pure refactor, no visual/behavioral changes.
   Studios load this before their own script and call the builders. */

const StudioTheme = {
  /* btnId: theme toggle button id; storageKey: localStorage key;
     defaultTheme: fallback when nothing saved ("dark", "light", or computed). */
  init(btnId, storageKey, defaultTheme = "dark") {
    const apply = th => {
      document.documentElement.dataset.theme = th;
      try { localStorage.setItem(storageKey, th); } catch (e) {}
    };
    let saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) {}
    apply(saved || defaultTheme);
    const btn = document.getElementById(btnId);
    if (btn) btn.onclick = () =>
      apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    return { get: () => document.documentElement.dataset.theme, set: apply };
  }
};

const StudioUI = {
  /* Segmented button group.
     el: container element. options: [[value, label], ...]. current: active value.
     onChange(value): called on tap. Adds .seg class; returns el. */
  segControl(el, options, current, onChange) {
    el.classList.add("seg");
    el.innerHTML = "";
    const sync = val => el.querySelectorAll("button").forEach(b =>
      b.classList.toggle("on", b.dataset.v == val)); // loose eq: dataset is string
    options.forEach(([value, label]) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.dataset.v = String(value);
      b.onclick = () => { sync(value); if (onChange) onChange(value); };
      el.appendChild(b);
    });
    sync(current);
    return el;
  },

  /* Labeled BPM slider row. Builds <label> + <input range> + <span> inside el.
     opts: {label, min, max, step, value, storageKey, onChange}
     Returns {el, get, set}. Persists to localStorage. No restart logic. */
  tempoSlider(el, opts) {
    const { label = "Tempo", min = 30, max = 240, step = 10, value, storageKey, onChange } = opts;
    el.classList.add("sliderow");
    el.innerHTML = "";
    const lab = document.createElement("label");
    lab.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = min; input.max = max; input.step = step;
    const val = document.createElement("span");
    let cur = value;
    // load persisted, clamp to range
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const n = +saved;
        if (n >= min && n <= max) cur = n;
      }
    } catch (e) {}
    const paint = () => { input.value = cur; val.textContent = cur + " BPM"; };
    paint();
    input.oninput = () => {
      cur = +input.value;
      val.textContent = cur + " BPM";
      try { localStorage.setItem(storageKey, String(cur)); } catch (e) {}
      if (onChange) onChange(cur);
    };
    el.appendChild(lab); el.appendChild(input); el.appendChild(val);
    return {
      el,
      get: () => cur,
      set: v => { cur = Math.max(min, Math.min(max, +v)); paint();
        try { localStorage.setItem(storageKey, String(cur)); } catch (e) {} }
    };
  },

  /* Chromatic C–B Sa picker (12 buttons).
     opts: {value (0-11, already validated), storageKey, onChange}
     Returns {el, get, set}. */
  saSelector(el, opts) {
    const SA_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    let cur = opts.value;
    const sync = () => el.querySelectorAll("button").forEach((x, xi) =>
      x.classList.toggle("on", xi === cur));
    el.classList.add("wrap"); // 12 notes -> 2 rows of 6
    // reuse segControl for the button building + active-state handling
    StudioUI.segControl(el, SA_NAMES.map((nm, i) => [i, nm]), cur, i => {
      cur = i;
      try { localStorage.setItem(opts.storageKey, String(i)); } catch (e) {}
      if (opts.onChange) opts.onChange(i);
    });
    return {
      el,
      get: () => cur,
      set: v => { cur = v;
        try { localStorage.setItem(opts.storageKey, String(v)); } catch (e) {}
        el.querySelectorAll("button").forEach((x, xi) => x.classList.toggle("on", xi === cur)); }
    };
  },

  /* Swara chip grid (8-per-row). Renders note chips with varisai-style classes.
     el: container. notes: array of swara strings ("-" = rest).
     opts: {labelFn(s) -> display text, isRest(s), isLow(s)}
     Returns {el, highlight(i), clear()}. */
  chipGrid(el, notes, opts = {}) {
    const labelFn = opts.labelFn || (s => s);
    const isRest = opts.isRest || (s => s === "-");
    const isLow = opts.isLow || (s => s.includes(","));
    el.innerHTML = "";
    const chips = notes.map(s => {
      const c = document.createElement("div");
      const lo = isLow(s), rest = isRest(s);
      c.className = "chip" + (lo ? " lo" : "") + (rest ? " rest" : "");
      c.textContent = rest ? "\u00b7" : labelFn(s);
      el.appendChild(c);
      return c;
    });
    return {
      el,
      highlight(i) {
        chips.forEach(x => x.classList.remove("playing"));
        if (chips[i]) chips[i].classList.add("playing");
      },
      clear() { chips.forEach(x => x.classList.remove("playing")); }
    };
  },

  /* Laya pattern display. Renders one title + boxed groups per part.
     el: container. laya: e.g. "11-22-33-44 and 11-22-33-44" or "11223344".
     "-" separates groups (logical separator, never a rest); " and " separates
     parts. Parenthesised count hints "(...)" are stripped. Returns el. */
  layaDisplay(el, laya) {
    el.innerHTML = "";
    const parsePart = part => {
      part = String(part).replace(/\s*\([^)]*\)\s*/g, "").trim();
      if (!part.includes("-")) return [part.replace(/\s+/g, "")];
      const groups = [];
      part.split(/\s+/).forEach(tok => { tok.split("-").forEach(g => { if (g) groups.push(g); }); });
      return groups;
    };
    const title = document.createElement("div");
    title.className = "laya-title";
    title.textContent = "Laya";
    el.appendChild(title);
    const parts = document.createElement("div");
    parts.className = "laya-parts";
    String(laya).split(" and ").map(parsePart).forEach((groups, pi) => {
      if (pi > 0) {
        const and = document.createElement("span");
        and.className = "laya-and";
        and.textContent = "and";
        parts.appendChild(and);
      }
      const pd = document.createElement("div");
      pd.className = "laya-part";
      groups.forEach(g => {
        const b = document.createElement("span");
        b.className = "laya-box";
        b.textContent = g;
        pd.appendChild(b);
      });
      parts.appendChild(pd);
    });
    el.appendChild(parts);
    const legend = document.createElement("div");
    legend.className = "laya-legend";
    legend.innerHTML = "digits count beats \u00b7 <code>,</code> = hold";
    el.appendChild(legend);
    return el;
  },

  /* Tala structure display (alankarams). Tappable; onTap(boxEl) fires on tap.
     el: container. tala: e.g. "I4 0 I4 I4".
     Shows beat math: "4 + 2 + 4 + 4 = 14 beats"
     (I<n> = n beats, 0 = drutam = 2, U = anudrutam = 1). Returns el. */
  talaDisplay(el, tala, onTap) {
    el.innerHTML = "";
    const angas = String(tala).trim().split(/\s+/);
    const beats = angas.map(a => {
      const m = a.match(/^I(\d+)$/);
      if (m) return parseInt(m[1], 10);
      if (a === "0") return 2;
      if (a === "U") return 1;
      return 0;
    });
    const total = beats.reduce((x, y) => x + y, 0);
    const wrap = document.createElement("div");
    wrap.className = "tala-wrap";
    const box = document.createElement("div");
    box.className = "laya tala-box-click";
    const title = document.createElement("div");
    title.className = "laya-title";
    title.textContent = "Tala";
    box.appendChild(title);
    const parts = document.createElement("div");
    parts.className = "laya-parts";
    const pd = document.createElement("div");
    pd.className = "laya-part";
    angas.forEach(a => {
      const b = document.createElement("span");
      b.className = "laya-box";
      b.textContent = a;
      pd.appendChild(b);
    });
    parts.appendChild(pd);
    box.appendChild(parts);
    const legend = document.createElement("div");
    legend.className = "laya-legend";
    legend.textContent = beats.join(" + ") + " = " + total + " beats";
    box.appendChild(legend);
    box.onclick = e => { e.stopPropagation(); if (onTap) onTap(box); };
    wrap.appendChild(box);
    el.appendChild(wrap);
    return el;
  },

  /* Anchored popover coachmark. Appends a .tala-popover below anchorEl, which
     must be a relatively-positioned container (e.g. the .tala-wrap from
     talaDisplay). Clicking inside the popover does not close it;
     the caller handles outside-click dismissal (toggle). Returns {close()}. */
  coachmark(anchorEl, htmlContent) {
    const pop = document.createElement("div");
    pop.className = "tala-popover";
    pop.innerHTML = htmlContent;
    pop.onclick = e => e.stopPropagation();
    anchorEl.appendChild(pop);
    return {
      el: pop,
      close() { pop.remove(); }
    };
  },

  /* Grouped swara notation: dlines = [line -> [group -> [token]]].
     el: container. opts: {labelFn(s), isRest(s), isLow(s)} (same as chipGrid).
     Each line renders as .talaline, each group as .tgroup, each note as
     span.chip. Lower-octave tokens get "lo" class + dot-below (\u0323);
     upper-octave tokens get "'" suffix; bare rest tokens keep "rest" class.
     Returns {el, highlight(li, gi, ni), clear()} for playback highlighting. */
  groupedGrid(el, dlines, opts = {}) {
    const labelFn = opts.labelFn || (s => s);
    const isRest = opts.isRest || (s => s === "-" || s === ",");
    const isLow = opts.isLow || (s => s[0] === "," && s !== ",");
    el.innerHTML = "";
    el.classList.add("grouped");
    const upOct = s => (s.match(/'/g) || []).length;
    const dispTok = s => labelFn(s) + (isLow(s) ? "\u0323" : "") + "'".repeat(upOct(s));
    const chips = []; // chips[li][gi][ni]
    dlines.forEach(line => {
      const ld = document.createElement("div");
      ld.className = "talaline";
      const lineChips = [];
      line.forEach(g => {
        if (g.length === 1 && isRest(g[0])) {
          const c = document.createElement("span");
          c.className = "chip rest";
          c.textContent = g[0];
          c.style.flex = "1 1 0";
          ld.appendChild(c);
          lineChips.push([c]);
        } else {
          const gd = document.createElement("div");
          gd.className = "tgroup";
          gd.style.flex = g.length + " " + g.length + " 0";
          const gChips = g.map(tok => {
            const c = document.createElement("span");
            const lo = isLow(tok), rest = isRest(tok);
            c.className = "chip" + (lo ? " lo" : "") + (rest ? " rest" : "");
            c.textContent = rest ? tok : dispTok(tok);
            gd.appendChild(c);
            return c;
          });
          ld.appendChild(gd);
          lineChips.push(gChips);
        }
      });
      el.appendChild(ld);
      chips.push(lineChips);
    });
    // Flat index map for playback compatibility (dlines flat === notes)
    const flatChips = [];
    chips.forEach(L => L.forEach(G => G.forEach(c => flatChips.push(c))));
    return {
      el,
      highlight(li, gi, ni) {
        chips.forEach(L => L.forEach(G => G.forEach(c => c.classList.remove("playing"))));
        let c;
        if (gi === undefined) {
          // Flat index (playback compatibility)
          c = flatChips[li];
        } else {
          c = chips[li] && chips[li][gi] && chips[li][gi][ni];
        }
        if (c) c.classList.add("playing");
      },
      clear() {
        chips.forEach(L => L.forEach(G => G.forEach(c => c.classList.remove("playing"))));
      }
    };
  }
};
