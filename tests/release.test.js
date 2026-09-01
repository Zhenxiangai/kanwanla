const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("manifest identifies 看完了 and grants only its runtime hosts", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "116");
  assert.equal(manifest.name, "看完了");
  assert.equal(manifest.version, "2.1.2");
  assert.equal(packageJson.name, "kanwanle");
  assert.equal(packageJson.version, manifest.version);
  assert.equal(manifest.options_ui.page, "options.html");
  assert.equal(manifest.permissions.includes("activeTab"), false);
  assert.equal(manifest.permissions.includes("tabCapture"), false);
  assert.equal(manifest.permissions.includes("offscreen"), false);
  assert.equal(Object.hasOwn(manifest, "optional_host_permissions"), false);

  assert.deepEqual(manifest.host_permissions, [
    "https://www.youtube.com/*",
    "https://api.supadata.ai/*",
    "https://api.siliconflow.cn/*",
    "https://www.bilibili.com/*",
    "https://api.bilibili.com/*",
    "https://*.hdslb.com/*",
    "https://api.github.com/*",
  ]);

  const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  assert.ok(scripts.includes("content.js"));
  assert.ok(scripts.includes("bilibili-content.js"));
  assert.equal(manifest.content_scripts.length, 2);
  const biliEntry = manifest.content_scripts.find((entry) =>
    entry.js?.includes("bilibili-content.js"),
  );
  assert.deepEqual(biliEntry.matches, [
    "https://www.bilibili.com/video/*",
    "https://www.bilibili.com/list/*",
  ]);
});

test("published copy explains all transcript paths and upstream attribution", () => {
  const chinese = read("README.md");
  const chineseCompatibility = read("README.zh-CN.md");
  const english = read("README.en.md");
  const privacy = read("PRIVACY.md");
  const security = read("SECURITY.md");
  const license = read("LICENSE");
  const notice = read("NOTICE");
  const published = [chinese, chineseCompatibility, english, privacy, security].join("\n");

  assert.match(chinese, /^# 看完了$/m);
  assert.match(english, /^# KanWanLe$/m);
  assert.match(chinese, /中文.*English/);
  assert.match(published, /Bilibili/i);
  assert.match(published, /B 站/);
  assert.match(published, /Supadata/);
  assert.match(published, /SiliconFlow/);
  assert.match(published, /deepseek-ai\/DeepSeek-V4-Flash/);
  assert.match(
    published,
    /https:\/\/cloud\.siliconflow\.cn\/i\/w3LDYnbF/,
  );
  assert.match(published, /https:\/\/supadata\.ai\/\?ref=xiang/);
  assert.match(published, /api\.bilibili\.com/);
  assert.match(published, /hdslb\.com/);
  assert.match(published, /no local server/i);
  assert.match(english, /zarazhangrui\/youtube-digest/);
  assert.match(chinese, /zarazhangrui\/youtube-digest/);
  assert.match(chinese, /Zhenxiangai\/kanwanle/);
  assert.match(notice, /https:\/\/github\.com\/zarazhangrui\/youtube-digest/);
  assert.match(license, /Zara Zhang \(youtube-digest\)/);
  assert.match(license, /Zhenxiangai/);
  assert.match(license, /k1234567 \(bilibili-digest\)/);
  assert.doesNotMatch(published, /api\.deepseek\.com/);
  assert.doesNotMatch(published, /Xiaoetong|小鹅通|audio\/transcriptions|音频转写/i);
});

test("release tooling includes platform and update modules", () => {
  const check = read("scripts/check-release.sh");
  for (const file of [
    "platforms.js",
    "bilibili-content.js",
    "lib/wbi.js",
    "lib/bili-api.js",
    "transcripts.js",
    "updates.js",
    "i18n.js",
    "notes.js",
    "analysis-progress.js",
    "learning-records.js",
    "README.en.md",
  ]) {
    assert.match(check, new RegExp(file.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
  assert.match(check, /matchAll\(\/\\bimportScripts/);
});

test("product UI contains no emoji or emoji-like pictographs", () => {
  const productUi = [
    read("sidepanel.html"),
    read("sidepanel.js"),
    read("content.js"),
    read("bilibili-content.js"),
    read("options.html"),
    read("options.js"),
  ].join("\n");
  assert.doesNotMatch(productUi, /\p{Extended_Pictographic}|[✓✕⧉▶]/u);
});

test("runtime has no source-file credential dependency or retired provider endpoint", () => {
  const runtime = [
    "background.js",
    "content.js",
    "bilibili-content.js",
    "transcripts.js",
    "sidepanel.js",
    "options.js",
    "settings.js",
    "platforms.js",
    "updates.js",
    "i18n.js",
    "notes.js",
    "analysis-progress.js",
    "learning-records.js",
    "lib/wbi.js",
    "lib/bili-api.js",
  ]
    .map(read)
    .join("\n");

  assert.doesNotMatch(runtime, /\bCONFIG\./);
  assert.doesNotMatch(runtime, /importScripts\(["']config\.js/);
  assert.doesNotMatch(runtime, /https:\/\/api\.deepseek\.com/);
  assert.match(runtime, /https:\/\/api\.siliconflow\.cn\/v1/);
  assert.match(runtime, /credentials: "include"/);
  assert.match(runtime, /credentials: "omit"/);
  assert.doesNotMatch(runtime, /xiaoe|小鹅通/i);
});

test("update UI uses browser updates with a validated GitHub fallback", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const background = read("background.js");
  const updates = read("updates.js");
  const updateRuntime = `${background}\n${updates}`;
  const panelHtml = read("sidepanel.html");
  const panelJs = read("sidepanel.js");
  const privacy = read("PRIVACY.md");

  assert.ok(manifest.host_permissions.includes("https://api.github.com/*"));
  assert.match(updateRuntime, /runtime\.requestUpdateCheck/);
  assert.match(updateRuntime, /runtime\.onUpdateAvailable/);
  assert.match(background, /KANWANLE_UPDATES\.createManager/);
  assert.match(updates, /RELEASES_URL/);
  assert.match(panelHtml, /id="updateBanner"/);
  assert.match(panelHtml, /<script src="updates\.js"><\/script>/);
  assert.match(panelJs, /textContent/);
  assert.match(privacy, /api\.github\.com/);
  assert.doesNotMatch(panelJs, /updateNotes[\s\S]{0,200}innerHTML/);
});

test("background reconciles side-panel state after navigation commits", () => {
  const background = read("background.js");
  assert.match(
    background,
    /function getNavigationUrl\(changeInfo, tab\)[\s\S]*changeInfo\.status !== "loading"[\s\S]*changeInfo\.status !== "complete"[\s\S]*tab\.pendingUrl \|\| tab\.url/,
  );
  assert.match(
    background,
    /function closePanelForTab\(tabId, windowId\)[\s\S]*chrome\.sidePanel\.close\(\{ tabId \}\)[\s\S]*chrome\.sidePanel\.close\(\{ windowId \}\)/,
  );
  assert.match(
    background,
    /YTD_PLATFORMS\.isSupportedSiteUrl\(url\)[\s\S]*await closePanelForTab\(tabId, windowId\)/,
  );
});

test("published prompt files contain runtime sections", () => {
  const expectedSections = {
    "prompts/analysis.md": ["System prompt", "User prompt"],
    "prompts/explain.md": ["System prompt", "User prompt"],
    "prompts/note-cleanup.md": ["System prompt", "User prompt"],
    "prompts/translation.md": [
      "Shared base rules",
      "Chinese rules",
      "Transcript batch translation",
    ],
  };
  for (const [file, sections] of Object.entries(expectedSections)) {
    const markdown = read(file);
    for (const section of sections) {
      assert.match(markdown, new RegExp(`^## ${section}$`, "m"));
    }
  }
});
