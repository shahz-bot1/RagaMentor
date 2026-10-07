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
  const norm = c => c.replace(/✓/g, "").split("·")[0].trim();
  E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"A",start:10,end:20,note:""},{id:"l2",name:"B",start:30,end:40,note:""},
           {id:"l3",name:"C",start:50,end:60,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["g3","l3"]},
            {id:"g3",name:"Opening",color:"#a78bfa",members:["l1","l2"]}]}); currentId="s1"; fsOpen=true;`);

  // inside Pallavi → ＋ New group → only Pallavi's DIRECT loops
  E(`selectGroup("g1"); newGroup();`);
  t("constrained mode", E(`checkConstrain==="g1" && checkIsNew===true`));
  let ch = chips().map(norm);
  t("direct loop C offered", ch.includes("C"));
  t("nested loops A,B NOT offered", !ch.includes("A") && !ch.includes("B"));
  t("hint mentions sub-groups stay", w.document.querySelector("#fsNote").textContent.includes("sub-groups stay"));

  // check C → Done → sub-group nested in Pallavi with only C
  E(`checkSel={"l3":true}; applyChecklist();`);
  const ng = E(`selectedGroupId`);
  t("new sub-group created", E(`groupById("${ng}") && parentOf("${ng}").id`) === "g1");
  t("sub-group holds only C", E(`groupById("${ng}").members.join()`) === "l3");
  t("A,B still in Opening", E(`parentOf("l1").id==="g3" && parentOf("l2").id==="g3"`));

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
