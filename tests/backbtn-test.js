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
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["g3","l1"]},
            {id:"g3",name:"Opening",color:"#a78bfa",members:["l2"]}]}); currentId="s1"; fsOpen=true;`);

  // inside sub-group: single back button labeled with parent
  E(`selectGroup("g3");`);
  let ch = chips();
  const backs = ch.filter(c => c.startsWith("‹"));
  t("exactly one back button", backs.length === 1);
  t("back labeled with parent name", backs[0] === "‹ Pallavi");
  t("no group-styled ancestor chip", !ch.some(c => c.includes("Pallavi") && c.includes("▸")));

  // tap back → parent selected, parent view open
  const backBtn = [...w.document.querySelectorAll("#fsChips .chip")].find(c => c.textContent === "‹ Pallavi");
  backBtn.click(); await sleep(50);
  t("back opens parent view", E(`fsGroupView`) === "g1");
  t("parent selected + looping", E(`selectedGroupId==="g1" && looping===true`));

  // inside top-level group: back = ‹ All
  ch = chips();
  const backs2 = ch.filter(c => c.startsWith("‹"));
  t("top-level: single ‹ All", backs2.length === 1 && backs2[0] === "‹ All");
  const allBtn = [...w.document.querySelectorAll("#fsChips .chip")].find(c => c.textContent === "‹ All");
  allBtn.click(); await sleep(50);
  t("‹ All clears to top", E(`fsGroupView===null && selectedGroupId===null && selectedLoopId===null`));

  // top level: no back button at all
  ch = chips();
  t("top level: no back button", !ch.some(c => c.startsWith("‹")));

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
