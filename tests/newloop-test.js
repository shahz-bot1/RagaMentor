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
    loops:[{id:"l1",name:"A",start:10,end:20,note:""},{id:"l2",name:"B",start:30,end:40,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1","l2"]}]}); currentId="s1"; fsOpen=true;`);

  // chip present inside group view, next to + Add
  E(`selectGroup("g1");`);
  let ch = chips();
  t("＋ New loop chip inside group", ch.some(c => c.includes("New loop")));
  t("chip order: New loop, Add, New group",
    ch.indexOf(ch.find(c => c.includes("New loop"))) <
    ch.indexOf(ch.find(c => c.includes("＋ Add"))) &&
    ch.indexOf(ch.find(c => c.includes("＋ Add"))) <
    ch.indexOf(ch.find(c => c.includes("New group"))));

  // from loop-edit mode: clears loop, keeps group, jumps to A–B tab
  E(`selectLoop("l1");`);
  t("edit mode before", E(`selectedLoopId==="l1"`));
  E(`newLoop();`);
  t("loop selection cleared", E(`selectedLoopId===null`));
  t("group stays selected+open", E(`selectedGroupId==="g1" && fsGroupView==="g1"`));
  t("A–B tab active", E(`fsTab==="ab"`) && w.document.querySelector('#fsPageAB').hidden === false);
  t("scratch cleared", E(`workingA===null && workingB===null`));
  t("header offers anywhere", w.document.querySelector("#fsEditHead").textContent.includes("anywhere"));

  // define outside + Add joins the group
  E(`workingA=50; workingB=60; addLoop(document.createElement("input"));`);
  t("new loop joins group", E(`parentOf(cur().loops[cur().loops.length-1].id).id`) === "g1");

  // top level: chip present too (covered in depth by newloop-top-test.js)
  E(`backToTop();`);
  ch = chips();
  t("＋ New loop also at top level", ch.some(c => c.includes("New loop")));

  // sub-group view also gets the chip
  E(`cur().groups.push({id:"g3",name:"Opening",color:"#a78bfa",members:[]});`);
  E(`groupById("g1").members.push("g3");`);
  E(`selectGroup("g3");`);
  ch = chips();
  t("＋ New loop in sub-group view", ch.some(c => c.includes("New loop")));

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
