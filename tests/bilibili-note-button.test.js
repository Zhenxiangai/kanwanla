const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "bilibili-content.js"),
  "utf8",
);

test("Bilibili note button uses the same conspicuous terracotta pill treatment as YouTube", () => {
  const noteFunction = source.match(
    /function injectNoteButton\(\)[\s\S]*?^  }/m,
  )?.[0];

  assert.ok(noteFunction, "Expected the Bilibili note-button injector");
  assert.match(noteFunction, /#c8674f/i);
  assert.match(noteFunction, /border-radius:\s*999px/);
  assert.match(noteFunction, /padding:\s*9px 16px/);
  assert.doesNotMatch(noteFunction, /rgba\(0,0,0,\.58\)/);
});
