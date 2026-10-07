// Runs every *-test.js suite in this folder sequentially and reports.
// Usage: npm test  (after `npm install`)
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const files = fs.readdirSync(__dirname).filter(f => f.endsWith("-test.js")).sort();
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8" });
  const tail = (r.stdout || "").trim().split("\n").slice(-2).join(" | ");
  const ok = r.status === 0;
  console.log((ok ? "PASS" : "FAIL") + "  " + f + "   (" + tail + ")");
  if (!ok) { failed++; if (r.stderr) console.log(r.stderr.slice(0, 500)); }
}
console.log(failed ? `\n${failed} suite(s) failed` : `\nAll ${files.length} suites passed`);
process.exit(failed ? 1 : 0);
