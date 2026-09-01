const test = require("node:test");
const assert = require("node:assert/strict");

const transcripts = require("../transcripts.js");

test("WebVTT captions become normalized seekable entries", () => {
  const entries = transcripts.parseVtt(`\uFEFFWEBVTT\n\ncue-1\n00:00:01.250 --> 00:00:04.500 align:start\n<v Speaker><b>Hello</b> &amp; welcome.</v>\n\n00:05.000 --> 00:06.500\n第二句。\n`);
  assert.deepEqual(entries, [
    { text: "Hello & welcome.", start: 1.25, duration: 3.25 },
    { text: "第二句。", start: 5, duration: 1.5 },
  ]);

  const result = transcripts.buildResult(entries, {
    language: "auto",
    source: "webvtt-test",
  });
  assert.equal(result.success, true);
  assert.equal(result.transcriptText, "Hello & welcome. 第二句。");
  assert.equal(
    result.transcriptTextTimestamped,
    "[0:01] Hello & welcome.\n[0:05] 第二句。",
  );
});
