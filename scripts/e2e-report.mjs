/**
 * Summarizes a Playwright JSON report on stdin: one line per non-passing test.
 * Used during verification runs to see failures without scrolling raw output.
 */
let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

const report = JSON.parse(raw);
const strip = (s) => String(s ?? "").replace(/\[\d+m/g, "");

const walk = (suites) => {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.[test.results.length - 1];
        if (!result || result.status === "passed" || result.status === "skipped") continue;
        const message = strip(result.errors?.[0]?.message)
          .split("\n")
          .filter((line) => line.trim())
          .slice(0, 2)
          .join(" | ");
        console.log(`[${result.status}] ${spec.title.slice(0, 70)} :: ${message.slice(0, 200)}`);
      }
    }
    walk(suite.suites);
  }
};

walk(report.suites);
console.log("stats:", JSON.stringify(report.stats));
