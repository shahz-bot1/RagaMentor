"use strict";
/* RagaMentor shared audio helpers — note-player path (RagaBrowser + Varisai
   + Compose). Pure refactor: same envelopes, same behavior. Do NOT use for
   LoopLab/Tala. playSampledSustain is additive (Compose long holds). */

const StudioAudio = (() => {
  let actx = null;
  const bufs = {};    // "base/file" -> AudioBuffer
  const loading = {}; // base -> promise

  /* Singleton AudioContext; resumes whenever it is not running. iOS reports
     "interrupted" (not "suspended") after the browser returns from background,
     so testing only for "suspended" left the engine frozen until a refresh. */
  function ensure() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== "running") {
      try { const p = actx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
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

  /* Equal-power crossfade curves for the sustain chain below:
     fadeIn² + fadeOut² = 1 at every point, so the combined level never dips
     or swells mid-crossfade (a linear pair dips −3dB on uncorrelated
     content; an exponential pair collapses almost to silence at centre). */
  const XF_N = 33;
  const XF_IN = new Float32Array(XF_N), XF_OUT = new Float32Array(XF_N);
  for (let i = 0; i < XF_N; i++) {
    const ph = (i / (XF_N - 1)) * Math.PI / 2;
    XF_IN[i] = Math.sin(ph); XF_OUT[i] = Math.cos(ph);
  }
  function xfC(gainParam, curve, t0, dur) {
    try { gainParam.setValueCurveAtTime(curve, t0, dur); }
    catch (e) { // fallback: linear pair
      gainParam.setValueAtTime(curve === XF_IN ? 0 : 1, t0);
      gainParam.linearRampToValueAtTime(curve === XF_IN ? 1 : 0, t0 + dur);
    }
  }

  /* Sampled note that can sustain LONGER than the sample itself: the same
     envelope as playSampled on a master gain, with the buffer's sustain
     section chained underneath as overlapping segments with equal-power
     crossfades — no hard loop jump (Compose Studio long holds). Notes that
     fit inside the buffer play as a single source, exactly like playSampled.
     Returns the first BufferSource, or null if no buffer. track(node)
     registers EVERY segment source so callers can stop them all. */
  function playSampledSustain(time, buffer, rate, dur, track) {
    if (!buffer) return null;
    const ctx = ensure();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.9, time + 0.02);
    g.gain.setValueAtTime(0.9, time + Math.max(0.02, dur - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
    g.connect(ctx.destination);
    const bd = buffer.duration || 0;
    const need = (dur + 0.25) * rate; // buffer-seconds we must cover
    const mk = () => {
      const s = ctx.createBufferSource();
      s.buffer = buffer; s.playbackRate.value = rate;
      if (track) track(s);
      return s;
    };
    if (!bd || need <= bd - 0.05 || bd <= 2.5) {
      const s = mk(); s.connect(g);
      if (bd > 1 && need > bd - 0.05) { // tiny-buffer fallback: hard loop
        try { s.loop = true; s.loopStart = 0.1; s.loopEnd = bd - 0.1; } catch (e) {}
      }
      s.start(time); s.stop(time + dur + 0.2);
      return s;
    }
    const XF = Math.min(0.8, bd * 0.2);            // crossfade (buffer seconds)
    const s0 = Math.min(0.5, bd * 0.1);            // sustain start (post-attack)
    const s1 = Math.max(s0 + XF + 0.3, bd - 0.5);  // sustain end
    const xfR = XF / rate, endNeed = time + dur + 0.25;
    let prev = null, start = time, offset = 0, first = null, count = 0;
    while (count < 64) {
      const src = mk(); count++;
      const sg = ctx.createGain();
      src.connect(sg); sg.connect(g);
      if (prev) {
        xfC(sg.gain, XF_IN, start, xfR);
        xfC(prev.sg.gain, XF_OUT, start, xfR);
        prev.src.stop(start + xfR + 0.05);
      } else {
        sg.gain.setValueAtTime(1, start);
        first = src;
      }
      src.start(start, offset);
      const reachEnd = start + (s1 - offset) / rate;
      prev = { src, sg };
      if (reachEnd >= endNeed) { src.stop(time + dur + 0.2); break; }
      start = reachEnd - xfR;
      offset = s0;
    }
    return first;
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

  return { ensure, loadSamples, getBuf, playSampled, playSampledSustain, playSynth };
})();
