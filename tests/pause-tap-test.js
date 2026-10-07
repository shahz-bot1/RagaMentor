const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../prototype/index.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errors.push("jsdomError: " + (e && e.message || e)));
const dom = new JSDOM(html, { url: "https://localhost/", runScripts: "dangerously",
  pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return new Proxy({}, { get: (t, p) => (p === "canvas" ? {} : () => ({})) });
    };
    let _paused = true;
    w.HTMLMediaElement.prototype.play = function () { _paused = false; return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause = function () { _paused = true; };
    Object.defineProperty(w.HTMLMediaElement.prototype, "paused", { get: () => _paused, configurable: true });
    w.HTMLMediaElement.prototype.load = function () {};
    w.URL.createObjectURL = () => "blob:mock"; w.URL.revokeObjectURL = () => {};
  }});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await sleep(1200);
  const w = dom.window, E = code => w.eval(code), out = [];
  const t = (n, c) => out.push([(c ? "PASS" : "FAIL") + "  " + n, c]);
  const aud = E(`audio`);
  Object.defineProperty(aud, "currentTime", { value: 200, writable: true, configurable: true });
  E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"A",start:10,end:20,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1"]}]}); currentId="s1"; fsOpen=true;`);
  E(`audio.pause();`);

  // paused + tap group → playhead moves, stays paused
  E(`selectGroup("g1");`);
  t("group selected", E(`selectedGroupId`) === "g1");
  t("playhead at group start", aud.currentTime === 10);
  t("stays paused", aud.paused === true);
  t("looping armed for when play resumes", E(`looping`) === true);

  // playing + tap group → keeps playing, playhead moves
  E(`audio.play();`);
  E(`selectGroup("g1");`);
  t("keeps playing when already playing", aud.paused === false);

  // loop behavior unchanged: paused + tap loop → moves, stays paused
  E(`audio.pause();`);
  E(`selectLoop("l1");`);
  t("loop tap stays paused", aud.paused === true && aud.currentTime === 10);

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
