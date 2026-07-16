const fs = require("fs");

const raw = fs.readFileSync("results.json", "utf-8");
const data = JSON.parse(raw);

const tests = [];

function walk(suites) {
  suites.forEach((suite) => {
    if (suite.suites) walk(suite.suites);
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        spec.tests.forEach((test) => {
          const result = test.results[0];
          tests.push({
            title: spec.title,
            status: result.status,
            durationMs: result.duration,
          });
        });
      });
    }
  });
}

walk(data.suites);

const total = tests.length;
const failedTests = tests.filter((t) => t.status !== "passed");
const totalDuration = tests.reduce((sum, t) => sum + t.durationMs, 0);
const avgDuration = total === 0 ? 0 : totalDuration / total;

// Flag anything taking noticeably longer than average as a potential
// performance anomaly (with a sensible floor so tiny tests don't count).
const SLOW_THRESHOLD_MS = Math.max(1500, avgDuration * 2);
const slowTests = tests.filter((t) => t.durationMs > SLOW_THRESHOLD_MS);

console.log("===================================");
console.log("AI-Assisted Monitoring & Log Analysis");
console.log("===================================");
console.log(`Total tests executed: ${total}`);
console.log(`Average test duration: ${avgDuration.toFixed(0)}ms`);
console.log(`Slow-test threshold: ${SLOW_THRESHOLD_MS.toFixed(0)}ms`);
console.log("-----------------------------------");

if (slowTests.length > 0) {
  console.log(`Performance anomalies detected: ${slowTests.length}`);
  slowTests.forEach((t) => {
    console.log(`  - "${t.title}" took ${t.durationMs}ms (above threshold)`);
  });
} else {
  console.log("No performance anomalies detected.");
}

console.log("-----------------------------------");
console.log("AI Summary:");

if (failedTests.length > 0) {
  console.log(
    `Likely cause: ${failedTests.length} test failure(s) detected, indicating a functional regression.`,
  );
  console.log(
    "Recommendation: Investigate failing test logic before deployment.",
  );
} else if (slowTests.length > 0) {
  console.log(
    "Likely cause: One or more tests are running significantly slower than average, which may indicate a UI rendering delay or inefficient DOM update.",
  );
  console.log(
    "Recommendation: Profile the flagged test(s) and check for unnecessary re-renders.",
  );
} else {
  console.log(
    "System healthy: all tests passed within expected time bounds. No anomalies detected.",
  );
  console.log(
    "Recommendation: Safe to proceed. Continue routine monitoring on next run.",
  );
}
