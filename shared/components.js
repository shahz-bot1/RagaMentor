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
  }
};
