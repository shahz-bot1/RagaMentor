"use strict";
/* RagaMentor shared audio helpers — note-player path (RagaBrowser + Varisai).
   Pure refactor: same envelopes, same behavior. Do NOT use for LoopLab/Tala. */

const StudioAudio = (() => {
  let actx = null;
  const bufs = {};    // "base/file" -> AudioBuffer
  const loading = {}; // base -> promise

  /* Singleton AudioContext; resumes if suspended. */
  function ensure() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  /* Load MP3s from basePath; cached per basePath. Returns promise. */
  function loadSamples(basePath, files) {
    const sep = basePath.endsWith("/") ? "" : "/";
    if (!loading[basePath]) {
      loading[basePath] = (async () => {
        const ctx = ensure();
        await Promise.all(files.map(async f => {
          const key = basePath + sep + f;
          if (bufs[key]) return;
          const res = await fetch(basePath + sep + f);
          if (!res.ok) throw new Error("sample " + f);
          bufs[key] = await ctx.decodeAudioData(await res.arrayBuffer());
        }));
      })();
    }
    return loading[basePath];
  }

  function getBuf(basePath, file) {
    const sep = basePath.endsWith("/") ? "" : "/";
    return bufs[basePath + sep + file] || null;
  }

  /* Sampled note with the shared harmonium envelope.
     Returns the BufferSource, or null if no buffer. track(node) to register. */
  function playSampled(time, buffer, rate, dur, track) {
    if (!buffer) return null;
    const ctx = ensure();
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.9, time + 0.02);
    g.gain.setValueAtTime(0.9, time + Math.max(0.02, dur - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
    src.connect(g); g.connect(ctx.destination);
    src.start(time); src.stop(time + dur + 0.2);
    if (track) track(src);
    return src;
  }

  /* Triangle-wave fallback when samples are unavailable. */
  function playSynth(time, freq, dur, track) {
    const ctx = ensure();
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.4, time + 0.03);
    g.gain.setValueAtTime(0.4, time + Math.max(0.03, dur - 0.09));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.12);
    o.connect(g); g.connect(ctx.destination);
    o.start(time); o.stop(time + dur + 0.15);
    if (track) track(o);
    return o;
  }

  return { ensure, loadSamples, getBuf, playSampled, playSynth };
})();
