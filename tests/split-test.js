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
  Object.defineProperty(aud, "currentTime", { value: 0, writable: true, configurable: true });
  Object.defineProperty(aud, "duration", { value: 480, configurable: true });
  E(`songs.push({id:"s1",title:"T",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"l1",name:"Phrase",start:1,end:10,note:"watch the ri"}],
    groups:[{id:"g1",name:"Pallavi",color:"#2dd4bf",members:["l1"]}]}); currentId="s1"; fsOpen=true;`);

  // button hidden with no loop selected
  E(`setFSTab("ab"); updateSplitBtn();`);
  t("split hidden with no loop", E(`document.querySelector("#fsSplitBtn").hidden`) === true);

  // eligibility
  E(`selectLoop("l1");`);
  t("button visible when editing", E(`document.querySelector("#fsSplitBtn").hidden`) === false);
  aud.currentTime = 4;   E(`updateSplitBtn();`);
  t("canSplit mid-loop", E(`canSplit()`) === true && E(`document.querySelector("#fsSplitBtn").disabled`) === false);
  aud.currentTime = 1.2; t("too close to start", E(`canSplit()`) === false);
  aud.currentTime = 9.8; t("too close to end", E(`canSplit()`) === false);
  aud.currentTime = 0.5; t("outside loop", E(`canSplit()`) === false);

  // split at 4
  aud.currentTime = 4; E(`splitLoop();`);
  const loops = E(`cur().loops.map(l => l.name + ":" + l.start + "-" + l.end + "|" + l.note)`);
  t("two loops after split", E(`cur().loops.length`) === 2);
  t("first keeps name+range", loops.some(x => x.startsWith("Phrase:1-4|")));
  t("second named 'Phrase 2'", loops.some(x => x.startsWith("Phrase 2:4-10|")));
  t("note copied to both", E(`cur().loops.every(l => l.note === "watch the ri")`));
  t("group slot preserved in order",
    E(`groupById("g1").members.length`) === 2 &&
    E(`cur().loops.find(l => l.id === groupById("g1").members[0]).name`) === "Phrase" &&
    E(`cur().loops.find(l => l.id === groupById("g1").members[1]).name`) === "Phrase 2");
  t("first piece selected + looping", E(`selLoop().name === "Phrase" && looping === true`));

  // name collision → Phrase 3
  const secondId = E(`cur().loops.find(l => l.name === "Phrase 2").id`);
  E(`selectLoop("${secondId}");`); aud.currentTime = 7; E(`splitLoop();`);
  t("collision unique-ifies to 'Phrase 3'",
    E(`cur().loops.some(l => l.name === "Phrase 3" && l.start === 7 && l.end === 10)`));

  // carve-out: split 1-10 at 4 and 6, delete middle → 1-4 + 6-10
  E(`songs.push({id:"s2",title:"U",duration:480,data:new Uint8Array(8).buffer,type:"audio/mpeg",size:8,
    loops:[{id:"m1",name:"Long",start:1,end:10,note:""}],groups:[]}); currentId="s2";`);
  E(`selectLoop("m1");`); aud.currentTime = 4; E(`splitLoop();`);
  const mid2 = E(`cur().loops.find(l => l.name === "Long 2").id`);
  E(`selectLoop("${mid2}");`); aud.currentTime = 6; E(`splitLoop();`);
  const mid = E(`cur().loops.find(l => l.name === "Long 2").id`);
  E(`deleteLoop("${mid}");`);
  const ranges = E(`cur().loops.map(l => l.start + "-" + l.end).sort().join()`);
  t("carve-out leaves 1-4 + 6-10", ranges === "1-4,6-10");

  // addLoop sort fix: top-level group containing a sub-group
  E(`currentId="s1";`);
  E(`cur().groups.push({id:"g9",name:"Sub",color:"#a78bfa",members:[]});`);
  E(`groupById("g1").members.push("g9");`);
  E(`fsGroupView="g1"; workingA=50; workingB=60;`);
  let crashed = false;
  try { E(`addLoop(document.createElement("input"));`); } catch (e) { crashed = true; }
  t("addLoop with sub-group member doesn't crash", !crashed);
  t("new loop joined g1", E(`parentOf(cur().loops[cur().loops.length-1].id).id`) === "g1");

  console.log(out.map(r => r[0]).join("\n"));
  const fails = out.filter(r => !r[1]).length;
  console.log("---\nfailures: " + fails + ", page errors: " + errors.length);
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error("HARNESS", e); process.exit(2); });
