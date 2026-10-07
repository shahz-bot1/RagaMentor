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
  const chips = () => [...w.document.querySelectorAll("#fsChips .chip")].map(c => c.textContent);
  E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"A",start:10,end:20,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1"]}]}); currentId="s1"; fsOpen=true;`);

  // top level: both dashed chips, New loop first
  E(`renderFSChips();`);
  let ch = chips();
  t("top: ＋ New loop chip", ch.some(c => c.includes("New loop")));
  t("top: ＋ New group chip", ch.some(c => c.includes("New group")));
  t("New loop before New group",
    ch.indexOf(ch.find(c => c.includes("New loop"))) < ch.indexOf(ch.find(c => c.includes("New group"))));

  // from a selected top-level loop: clears all, jumps to A–B, no group context
  E(`selectLoop("l1");`);
  E(`newLoop();`);
  t("selection cleared", E(`selectedLoopId===null && selectedGroupId===null`));
  t("A–B tab active", E(`fsTab==="ab"`));
  t("scratch cleared", E(`workingA===null && workingB===null`));

  // add → ungrouped loop
  E(`workingA=50; workingB=60; addLoop(document.createElement("input"));`);
  t("new loop ungrouped at top level", E(`parentOf(cur().loops[cur().loops.length-1].id)===null`));

  // inside group still works with unified fn
  E(`selectGroup("g1"); newLoop();`);
  t("in-group: group context kept", E(`selectedGroupId==="g1" && fsGroupView==="g1" && fsTab==="ab"`));

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
