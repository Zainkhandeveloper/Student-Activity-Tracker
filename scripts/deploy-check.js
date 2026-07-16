const fs = require("fs");

const raw = fs.readFileSync("results.json", "utf-8");
const data = JSON.parse(raw);

let passed = 0;
let failed = 0;

function walk(suites) {
  suites.forEach((suite) => {
    if (suite.suites) walk(suite.suites);
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        spec.tests.forEach((test) => {
          const outcome = test.results[0].status;
          if (outcome === "passed") passed++;
          else failed++;
        });
      });
    }
  });
}

walk(data.suites);

const total = passed + failed;
const passRate = total === 0 ? 0 : (passed / total) * 100;

console.log("===================================");
console.log("AI-Assisted Deployment Analysis");
console.log("===================================");
console.log(`Total tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass rate: ${passRate.toFixed(1)}%`);
console.log("-----------------------------------");

if (passRate === 100) {
  console.log("Recommendation: DEPLOY");
  console.log(
    "Reason: All tests passed. No regressions detected. Safe to deploy.",
  );
} else if (passRate >= 80) {
  console.log("Recommendation: DEPLOY WITH CAUTION");
  console.log("Reason: Minor test failures detected. Review before deploying.");
} else {
  console.log("Recommendation: ROLLBACK / DO NOT DEPLOY");
  console.log(
    `Reason: ${failed} test(s) failed (pass rate ${passRate.toFixed(1)}%). Deployment blocked.`,
  );
}
