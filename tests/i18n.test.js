const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const i18n = require("../i18n.js");
const settings = require("../settings.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("new installs are Chinese-first and auto follows the browser language", () => {
  assert.equal(i18n.normalizePreference(undefined), "zh-CN");
  assert.equal(i18n.normalizePreference("unsupported"), "zh-CN");
  assert.equal(i18n.resolveLanguage("auto", "en-US"), "en");
  assert.equal(i18n.resolveLanguage("auto", "zh-TW"), "zh-CN");
  assert.equal(i18n.resolveLanguage("auto", "fr-FR"), "en");
});

test("every shared UI key has Chinese and English copy", () => {
  assert.deepEqual(
    Object.keys(i18n.COPY.en).sort(),
    Object.keys(i18n.COPY["zh-CN"]).sort(),
  );
  assert.equal(i18n.translate("zh-CN", "notes"), "笔记");
  assert.equal(i18n.translate("en", "notes"), "Notes");
});

test("AI output language is independent and defaults to the interface", () => {
  assert.equal(settings.normalize({}).outputLanguage, "interface");
  for (const outputLanguage of ["interface", "zh-CN", "en", "source"]) {
    assert.equal(
      settings.normalize({ provider: "siliconflow", outputLanguage })
        .outputLanguage,
      outputLanguage,
    );
  }
  assert.equal(
    settings.normalize({ provider: "siliconflow", outputLanguage: "xx" })
      .outputLanguage,
    "interface",
  );
});

test("AI prompts receive an explicit output-language instruction", () => {
  assert.match(
    i18n.outputLanguageInstruction("interface", "zh-CN"),
    /Simplified Chinese/,
  );
  assert.match(i18n.outputLanguageInstruction("en", "zh-CN"), /English/);
  assert.match(i18n.outputLanguageInstruction("source", "zh-CN"), /source/);
  assert.match(read("prompts/analysis.md"), /\{outputLanguageInstruction\}/);
  assert.match(read("prompts/explain.md"), /\{outputLanguageInstruction\}/);
});

test("settings exposes auto interface choice and independent AI output choice", () => {
  const html = read("options.html");
  assert.match(html, /data-language="auto"/);
  assert.match(html, /id="outputLanguage"/);
  assert.match(html, /value="interface"/);
  assert.match(html, /value="source"/);
});

test("side panel and both page adapters load the shared i18n module", () => {
  const manifest = JSON.parse(read("manifest.json"));
  for (const contentScript of manifest.content_scripts) {
    assert.equal(contentScript.js[0], "i18n.js");
    assert.equal(contentScript.js[1], "notes.js");
  }
  assert.match(
    read("sidepanel.html"),
    /<script src="i18n\.js"><\/script>[\s\S]*<script src="sidepanel\.js"><\/script>/,
  );
});
