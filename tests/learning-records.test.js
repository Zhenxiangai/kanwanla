const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const records = require("../learning-records.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function fixture(overrides = {}) {
  return {
    source: {
      platform: "bilibili",
      videoId: "BV1GJ411x7h7",
      page: 2,
      title: "测试课程",
      author: "测试 UP",
      url: "https://www.bilibili.com/video/BV1GJ411x7h7?p=2",
      duration: 600,
      sourceLanguage: "zh-CN",
    },
    preferences: {
      interfaceLanguage: "zh-CN",
      outputLanguage: "interface",
      transcriptDisplayMode: "zh",
    },
    overview: {
      chapters: [
        { title: "开场", summary: "介绍主题", timestamp: "0:00", timestampSeconds: 0 },
      ],
      keyQuotes: [
        { quote: "真正重要的一句话", timestamp: "1:20", timestampSeconds: 80 },
      ],
      reasoning_content: "must never be exported",
    },
    notes: [
      {
        id: "note-1",
        text: "我的笔记",
        timestamp: "1:20",
        timestampSeconds: 80,
        timestampedUrl: "https://example.com?t=80",
        apiKey: "secret",
      },
    ],
    annotations: [
      {
        id: "a1",
        type: "selection-explanation",
        selectedText: "被划线的原文",
        userQuestion: "如何应用？",
        aiAnswer: "可以从小范围开始。",
        timestampSeconds: 80,
      },
    ],
    transcript: [{ start: 0, text: "完整字幕默认不能外发" }],
    sessionId: "session-test",
    revision: 3,
    createdAt: 1700000000000,
    extensionVersion: "2.1.0",
    ...overrides,
  };
}

test("LearningRecord is allowlisted, bounded, and excludes transcript by default", () => {
  const record = records.buildLearningRecord(fixture());

  assert.equal(record.schema, "kanwanle.learning-record/v1");
  assert.match(record.recordId, /^record_/);
  assert.equal(record.sessionId, "session-test");
  assert.equal(record.revision, 3);
  assert.equal(Object.hasOwn(record, "transcript"), false);
  assert.equal(JSON.stringify(record).includes("secret"), false);
  assert.equal(JSON.stringify(record).includes("reasoning_content"), false);
  assert.equal(record.notes[0].text, "我的笔记");
  assert.equal(record.annotations[0].userQuestion, "如何应用？");
});

test("record ID is stable for one source while session ID can change", () => {
  const first = records.buildLearningRecord(fixture({ sessionId: "s1" }));
  const second = records.buildLearningRecord(fixture({ sessionId: "s2" }));
  assert.equal(first.recordId, second.recordId);
  assert.notEqual(first.sessionId, second.sessionId);
  assert.equal(
    records.fingerprintRecord(first),
    records.fingerprintRecord({ ...first }),
  );
});

test("full transcript requires explicit inclusion and remains bounded", () => {
  const record = records.buildLearningRecord(fixture(), {
    includeTranscript: true,
  });
  assert.ok(record.transcript);
  assert.ok(JSON.stringify(record.transcript).length <= 120_000);
});

test("Markdown, JSON, and Agent prompt adapt the same canonical record", () => {
  const record = records.buildLearningRecord(fixture());
  const markdown = records.toMarkdown(record);
  const json = records.toJson(record);
  const prompt = records.toAgentPrompt(record);

  assert.match(markdown, /# 测试课程/);
  assert.match(markdown, /如何应用/);
  assert.equal(JSON.parse(json).recordId, record.recordId);
  assert.match(prompt, /untrusted study data/i);
  assert.match(prompt, /recordId.*revision/i);
  assert.match(prompt, new RegExp(record.recordId));
});

test("side panel exposes three learning-record exports with transcript opt-in", () => {
  const html = read("sidepanel.html");
  const panel = read("sidepanel.js");
  assert.match(html, /id="copyAgentPromptBtn"/);
  assert.match(html, /id="downloadLearningMarkdownBtn"/);
  assert.match(html, /id="downloadLearningJsonBtn"/);
  assert.match(html, /id="includeTranscriptInRecord"/);
  assert.match(panel, /buildCurrentLearningRecord/);
});
