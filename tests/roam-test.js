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
    w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause = function () {};
    w.HTMLMediaElement.prototype.load = function () {};
    w.URL.createObjectURL = () => "blob:mock"; w.URL.revokeObjectURL = () => {};
  }});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await sleep(1200);
  const w = dom.window, E = code => w.eval(code), out = [];
  const t = (n, c) => out.push([(c ? "PASS" : "FAIL") + "  " + n, c]);
  E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"A",start:10,end:20,note:""},{id:"l2",name:"B",start:30,end:40,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1","l2"]}]}); currentId="s1"; fsOpen=true;`);
  const aud = E(`audio`);
  Object.defineProperty(aud, "paused", { value: false, configurable: true });
  Object.defineProperty(aud, "currentTime", { value: 0, writable: true, configurable: true });

  E(`selectGroup("g1"); setFSTab("ab");`);
  aud.currentTime = 50; E(`loopCheck();`);
  t("A–B+group: roams free", aud.currentTime === 50);
  E(`setFSTab("loops");`);
  aud.currentTime = 50; E(`loopCheck();`);
  t("back to Loops: bounds reinstated", aud.currentTime === 10);
  // via the chip from edit mode
  E(`selectLoop("l1"); newLoop();`);
  aud.currentTime = 50; E(`loopCheck();`);
  t("chip → A–B: roams free (group context)", aud.currentTime === 50);
  E(`setFSTab("loops");`);
  aud.currentTime = 50; E(`loopCheck();`);
  t("chip flow: bounds reinstated on return", aud.currentTime === 10);
  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
