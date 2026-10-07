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
           {id:"l3",name:"C",start:50,end:60,note:""},{id:"l4",name:"D",start:70,end:80,note:""},
           {id:"l5",name:"E",start:90,end:100,note:""}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["g3","l3"]},
            {id:"g3",name:"Opening",color:"#a78bfa",members:["l1","l2"]},
            {id:"g4",name:"Bridge",color:"#38bdf8",members:["l4"]}]}); currentId="s1"; fsOpen=true;`);

  // top-level ＋ New group → only top-level items
  E(`newGroup();`);
  t("checklist is new-group mode", E(`checkIsNew===true && checkConstrain===null`));
  let ch = chips().map(norm);
  t("ungrouped loop E offered", ch.includes("E"));
  t("flat top-level group Bridge offered", ch.some(c => c.includes("Bridge")));
  t("nested loops A,B,C NOT offered", !ch.includes("A") && !ch.includes("B") && !ch.includes("C"));
  t("nested loop D (in Bridge) NOT offered", !ch.includes("D"));
  t("group with sub-groups (Pallavi) NOT offered", !ch.some(c => c.includes("Pallavi")));
  t("nested sub-group (Opening) NOT offered", !ch.some(c => c.includes("Opening")));
  t("hint mentions top-level", w.document.querySelector("#fsNote").textContent.includes("top-level"));

  // check E + Bridge → apply → nested correctly
  E(`checkSel={}; const ng=groupById(fsGroupView); checkSel["l5"]=true; checkSel["g4"]=true; applyChecklist();`);
  const ngId = E(`selectedGroupId`);
  t("new group has E + Bridge", E(`groupById("${ngId}").members.slice().sort().join()`) === "g4,l5");
  t("Bridge nested under new group", E(`parentOf("g4").id`) === ngId);
  t("D stays in Bridge", E(`parentOf("l4").id`) === "g4");

  // ＋ Add inside a group still offers everything (reorganization tool)
  // Bridge is now nested (correctly excluded); add a fresh flat top-level group
  E(`cur().loops.push({id:"l6",name:"F",start:110,end:120,note:""});`);
  E(`cur().groups.push({id:"g5",name:"Outro",color:"#f472b6",members:["l6"]});`);
  E(`selectGroup("g1"); enterChecklist();`);
  ch = chips().map(norm);
  t("+Add still offers nested loops", ch.includes("A") && ch.includes("D"));
  t("+Add offers flat top-level groups", ch.some(c => c.includes("Outro")));
  t("+Add excludes newly-nested Bridge", !ch.some(c => c.includes("Bridge")));
  E(`cancelChecklist();`);

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
