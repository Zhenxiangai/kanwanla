const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  buildTimedExcerpt,
  createCaptureController,
  createFeedbackModel,
} = require("../notes.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("capture controller de-duplicates click and N while one save is pending", async () => {
  let resolveSave;
  let saveCalls = 0;
  const states = [];
  const controller = createCaptureController({
    save(payload) {
      saveCalls += 1;
      assert.equal(payload.videoId, "video-a");
      return new Promise((resolve) => {
        resolveSave = resolve;
      });
    },
    onStateChange(state) {
      states.push(state);
    },
  });

  const fromClick = controller.capture({ videoId: "video-a" });
  const fromShortcut = controller.capture({ videoId: "video-a" });
  assert.equal(fromClick, fromShortcut);
  assert.equal(saveCalls, 1);

  const note = { id: "n1", text: "实际保存的文字", timestamp: "1:32" };
  resolveSave({ success: true, note });
  const result = await fromClick;

  assert.equal(result.note, note);
  assert.deepEqual(states, [
    { status: "saving" },
    { status: "saved", note },
  ]);
});

test("capture controller exposes a useful error and never emits saved state", async () => {
  const states = [];
  const controller = createCaptureController({
    save: async () => ({
      success: false,
      error: "NO_TRANSCRIPT",
      message: "此视频没有可用字幕，暂时无法记录当前时间。",
    }),
    onStateChange: (state) => states.push(state),
  });

  const result = await controller.capture({ videoId: "video-a" });

  assert.equal(result.success, false);
  assert.equal(result.message, "此视频没有可用字幕，暂时无法记录当前时间。");
  assert.deepEqual(states, [
    { status: "saving" },
    {
      status: "error",
      error: "NO_TRANSCRIPT",
      message: "此视频没有可用字幕，暂时无法记录当前时间。",
    },
  ]);
});

test("timed excerpt is deterministic, local, and centered on the current cue", () => {
  const excerpt = buildTimedExcerpt(
    [
      { start: 0, text: "开场白。" },
      { start: 8, text: "第一个重点还没有说完" },
      { start: 11, text: "这里把它补充完整。" },
      { start: 18, text: "这是下一段。" },
    ],
    10,
  );

  assert.equal(excerpt.rawText, "第一个重点还没有说完");
  assert.match(excerpt.text, /第一个重点还没有说完/);
  assert.ok(excerpt.text.length <= 600);
});

test("success feedback is built from the note returned by persistence", () => {
  const model = createFeedbackModel({
    success: true,
    note: {
      timestamp: "22:40",
      videoTitle: "测试视频",
      text: "这才是实际保存下来的内容。",
      timestampedUrl: "https://example.com/watch?t=1360",
    },
  });

  assert.equal(model.kind, "success");
  assert.equal(model.title, "笔记已保存");
  assert.equal(model.meta, "22:40 — 测试视频");
  assert.equal(model.text, "这才是实际保存下来的内容。");
  assert.equal(model.actions.copyLink, true);
  assert.equal(model.actions.openNotes, true);
});

test("all three note surfaces load the shared capture and feedback module", () => {
  const manifest = JSON.parse(read("manifest.json"));
  for (const contentScript of manifest.content_scripts) {
    assert.equal(contentScript.js[1], "notes.js");
  }

  const panelHtml = read("sidepanel.html");
  assert.match(panelHtml, /<script src="notes\.js"><\/script>[\s\S]*<script src="sidepanel\.js"><\/script>/);

  for (const file of ["content.js", "bilibili-content.js", "sidepanel.js"]) {
    const source = read(file);
    assert.match(source, /KANWANLE_NOTES\.createCaptureController/);
    assert.match(source, /KANWANLE_NOTES\.renderFeedback/);
  }
});

test("Notes tab exposes a visible current-time action and count", () => {
  const panel = read("sidepanel.html");
  assert.match(panel, /id="saveCurrentNoteBtn"/);
  assert.match(panel, /id="notesCount"/);
  assert.match(read("sidepanel.js"), /saveCurrentNoteFromPanel/);
});
