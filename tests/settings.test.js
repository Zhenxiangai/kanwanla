const test = require("node:test");
const assert = require("node:assert/strict");

const settings = require("../settings.js");

test("SiliconFlow defaults pin the China API endpoint and DeepSeek V4 Flash", () => {
  assert.equal(
    settings.DEFAULTS.aiModel,
    "deepseek-ai/DeepSeek-V4-Flash",
  );
  assert.equal(settings.normalize({}).aiModel, settings.DEFAULTS.aiModel);
  assert.equal(settings.DEFAULTS.youtubeTranscriptMode, "native");
  assert.equal(settings.normalize({}).youtubeTranscriptMode, "native");
  assert.equal(
    settings.normalize({ youtubeTranscriptMode: "auto" }).youtubeTranscriptMode,
    "auto",
  );
  assert.equal(
    settings.normalize({ provider: "siliconflow", aiModel: "" }).aiModel,
    settings.DEFAULTS.aiModel,
  );

  const normalized = settings.normalize({
    provider: "siliconflow",
    aiApiKey: "  example-key  ",
    aiBaseUrl: "https://api.example.com/v1",
    aiModel: " Qwen/Qwen3-8B ",
    supadataApiKey: "  example-supadata  ",
  });

  assert.equal(normalized.provider, "siliconflow");
  assert.equal(normalized.aiBaseUrl, "https://api.siliconflow.cn/v1");
  assert.equal(normalized.aiModel, "Qwen/Qwen3-8B");
  assert.equal(normalized.aiApiKey, "example-key");
  assert.equal(normalized.supadataApiKey, "example-supadata");
  assert.equal(
    settings.chatCompletionsUrl(),
    "https://api.siliconflow.cn/v1/chat/completions",
  );
  assert.equal(
    settings.modelsUrl(),
    "https://api.siliconflow.cn/v1/models?type=text&sub_type=chat",
  );
});

test("legacy provider migration clears only the AI key and is idempotent", () => {
  const legacy = {
    provider: "deepseek",
    aiApiKey: "old-provider-secret",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-chat",
    supadataApiKey: " supadata-secret ",
  };
  const first = settings.migrateLegacyProvider(legacy);

  assert.equal(first.migrated, true);
  assert.equal(first.settings.provider, "siliconflow");
  assert.equal(first.settings.aiBaseUrl, settings.DEFAULTS.aiBaseUrl);
  assert.equal(first.settings.aiModel, settings.DEFAULTS.aiModel);
  assert.equal(first.settings.aiApiKey, "");
  assert.equal(first.settings.supadataApiKey, "supadata-secret");

  const second = settings.migrateLegacyProvider(first.settings);
  assert.equal(second.migrated, false);
  assert.deepEqual(second.settings, first.settings);
});

test("model IDs are validated without restricting SiliconFlow namespaces", () => {
  assert.equal(
    settings.normalizeModel("Pro/deepseek-ai/DeepSeek-V3.1"),
    "Pro/deepseek-ai/DeepSeek-V3.1",
  );
  assert.equal(settings.normalizeModel("bad model with spaces"), "");
  assert.equal(settings.normalizeModel("<script>"), "");
});

test("Supadata receives a canonical YouTube URL", () => {
  assert.equal(
    settings.canonicalYouTubeUrl("ydTeb_I0b94"),
    "https://www.youtube.com/watch?v=ydTeb_I0b94",
  );
  assert.throws(
    () => settings.canonicalYouTubeUrl('"><script>'),
    /Invalid YouTube video ID/,
  );
});
