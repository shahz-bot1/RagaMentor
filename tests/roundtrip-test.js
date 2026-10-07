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
  const aud = E(`audio`);
  Object.defineProperty(aud, "duration", { value: 480, configurable: true });
  const seed = () => E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"Phrase",start:10,end:20,note:"a"},{id:"l2",name:"Phrase",start:30,end:40,note:"b"},
           {id:"l3",name:"Verse",start:50,end:60,note:"c"}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1","l3"]},
            {id:"g2",name:"Pallavi",color:"#a78bfa",members:["l2"]}]}); currentId="s1";`);
  const wipe = () => E(`songs.push({id:"s9",title:"W",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[],groups:[]}); currentId="s9";`);
  const snap = () => E(`({loops: cur().loops.map(l => [l.name,l.start,l.end,l.note].join("|")).sort().join(";"),
    groups: cur().groups.map(g => g.name + ":" + g.members.map(m => { const l = cur().loops.find(x => x.id === m);
      return l ? l.name + "@" + l.start : "?"; }).join(",")).sort().join(";")})`);

  // ---- v2 round-trip with duplicate names ----
  seed();
  const data = E(`buildExportData()`);
  t("export is version 3", data.version === 3);
  t("ids are file-local serials",
    JSON.stringify(data.loops.map(l => l.id)) === "[1,2,3]" &&
    JSON.stringify(data.groups.map(g => g.id)) === "[4,5]");
  t("members are serial lists", data.groups.every(g => Array.isArray(g.members)));
  const before = snap();
  wipe();
  const msg = E(`importLoopsData(JSON.parse(${JSON.stringify(JSON.stringify(data))}))`);
  t("import reports success", typeof msg === "string" && msg.includes("Imported 3 loops"));
  t("loops restored", E(`cur().loops.length`) === 3);
  t("decoupled: db ids are fresh, not file serials",
    E(`cur().loops.every(l => typeof l.id === "string" && l.id.includes("-"))`) &&
    E(`!cur().loops.some(l => ["l1","l2","l3"].includes(l.id))`));
  t("duplicate names all survive", E(`cur().loops.filter(l => l.name === "Phrase").length`) === 2);
  t("both same-named groups survive", E(`cur().groups.filter(g => g.name === "Pallavi").length`) === 2);
  const after = snap();
  t("state identical after round-trip", JSON.stringify(before) === JSON.stringify(after));

  // idempotency: export → import → export is stable
  const data2 = E(`buildExportData()`);
  t("export stable across round-trip (loops/groups identical)",
    JSON.stringify({ ...data, exportedAt: 0, song: "" }) ===
    JSON.stringify({ ...data2, exportedAt: 0, song: "" }));

  // ---- v2 uuid-keyed file (the short-lived format): keys still resolve ----
  wipe();
  const v2 = { app: "RagaMentor", version: 2, song: "T",
    loops: [{ id: "u1", name: "Phrase", start: 10, end: 20 }, { id: "u2", name: "Phrase", start: 30, end: 40 }],
    groups: [{ id: "u3", name: "Pallavi", color: "#2dd4bf", members: ["u1", "u2"] }] };
  E(`importLoopsData(JSON.parse(${JSON.stringify(JSON.stringify(v2))}))`);
  t("v2 keys resolve membership",
    E(`cur().groups[0].members.length`) === 2 &&
    E(`!cur().loops.some(l => ["u1","u2"].includes(l.id))`));

  // ---- v1 backward compatibility (name-based, first wins) ----
  wipe();
  const v1 = { app: "RagaMentor", version: 1, song: "T",
    loops: [{ name: "Phrase", start: 10, end: 20, note: "a" }, { name: "Phrase", start: 30, end: 40, note: "b" }],
    groups: [{ name: "Pallavi", color: "#2dd4bf", loops: ["Phrase"], groups: [] }] };
  E(`importLoopsData(JSON.parse(${JSON.stringify(JSON.stringify(v1))}))`);
  t("v1 imports", E(`cur().loops.length`) === 2);
  t("v1 first-wins membership", E(`cur().groups[0].members.length`) === 1 &&
    E(`cur().loops.find(l => l.id === cur().groups[0].members[0]).start`) === 10);

  // invalid data → null, no crash
  t("garbage rejected", E(`importLoopsData({nope:1})`) === null && E(`importLoopsData(null)`) === null);

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
