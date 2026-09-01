const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  createProgressTracker,
  shouldApplyProgressEvent,
} = require("../analysis-progress.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("progress reports real stages, elapsed time, and stream activity", () => {
  let now = 1000;
  const events = [];
  const tracker = createProgressTracker({
    requestId: "request-a",
    now: () => now,
    emit: (event) => events.push(event),
    throttleMs: 0,
  });

  tracker.update("preparing");
  now = 1400;
  tracker.update("requesting");
  now = 1800;
  tracker.activity();
  now = 2100;
  tracker.update("parsing");
  now = 2300;
  tracker.finish("done");

  assert.deepEqual(
    events.map((event) => event.stage),
    ["preparing", "requesting", "streaming", "parsing", "done"],
  );
  assert.equal(events.at(-1).elapsedMs, 1300);
  assert.equal(events[2].activityCount, 1);
  assert.ok(events[2].phaseProgress < events[3].phaseProgress);
  assert.equal(events.at(-1).terminal, true);
});

test("stale or terminal requests cannot update the active overview", () => {
  assert.equal(
    shouldApplyProgressEvent({ requestId: "new", terminal: false }, "new"),
    true,
  );
  assert.equal(
    shouldApplyProgressEvent({ requestId: "old", terminal: false }, "new"),
    false,
  );
  assert.equal(shouldApplyProgressEvent(null, "new"), false);
});

test("overview UI includes a request-scoped stage progress surface", () => {
  const html = read("sidepanel.html");
  const panel = read("sidepanel.js");
  assert.match(html, /id="analysisProgress"/);
  assert.match(html, /id="analysisProgressFill"/);
  assert.match(panel, /currentAnalysisRequestId/);
  assert.match(panel, /message\.action === "analysisProgress"/);
  assert.match(panel, /requestId:/);
});
