const test = require("node:test");
const assert = require("node:assert/strict");

const updates = require("../updates.js");
const manifest = require("../manifest.json");

test("bundled release notes stay in sync with the manifest", () => {
  assert.equal(updates.CURRENT_RELEASE.version, manifest.version);
});

test("versions are normalized and compared numerically", () => {
  assert.equal(updates.normalizeVersion("v2.10.3"), "2.10.3");
  assert.equal(updates.normalizeVersion("2.0.0.4"), "2.0.0.4");
  assert.equal(updates.normalizeVersion("2.0"), "");
  assert.equal(updates.normalizeVersion("2.0.0-beta"), "");
  assert.ok(updates.compareVersions("2.10.0", "2.9.9") > 0);
  assert.ok(updates.compareVersions("2.0.0", "2.0.0.1") < 0);
  assert.equal(updates.isNewerVersion("2.0.0", "2.0.0"), false);
  assert.equal(updates.isNewerVersion("2.0.0", "2.1.0"), true);
});

test("GitHub release metadata is reduced to validated plain text", () => {
  const release = updates.normalizeRelease({
    tag_name: "v2.1.0",
    name: "看完了 2.1.0",
    html_url:
      "https://github.com/Zhenxiangai/kanwanle/releases/tag/v2.1.0",
    published_at: "2026-09-02T08:00:00Z",
    draft: false,
    prerelease: false,
    body: [
      "# 更新内容",
      "- **新增** [版本提醒](https://example.com)",
      "- 修复 `<script>alert(1)</script>` 显示问题",
      "- " + "很长的说明".repeat(80),
      "- 第四条",
      "- 第五条不会进入结果",
    ].join("\n"),
  });

  assert.equal(release.version, "2.1.0");
  assert.equal(release.title, "看完了 2.1.0");
  assert.equal(
    release.url,
    "https://github.com/Zhenxiangai/kanwanle/releases/tag/v2.1.0",
  );
  assert.equal(release.notes.length, 4);
  assert.match(release.notes[0], /新增.*版本提醒/);
  assert.doesNotMatch(release.notes.join("\n"), /https?:|[*`<>]/);
  assert.ok(release.notes[2].length <= updates.MAX_NOTE_CHARS);
});

test("foreign, draft, prerelease, and malformed releases are rejected", () => {
  const valid = {
    tag_name: "v2.1.0",
    html_url:
      "https://github.com/Zhenxiangai/kanwanle/releases/tag/v2.1.0",
    body: "- 更新",
  };

  assert.equal(
    updates.normalizeRelease({
      ...valid,
      html_url: "https://example.com/Zhenxiangai/kanwanle/releases/tag/v2.1.0",
    }),
    null,
  );
  assert.equal(updates.normalizeRelease({ ...valid, draft: true }), null);
  assert.equal(updates.normalizeRelease({ ...valid, prerelease: true }), null);
  assert.equal(
    updates.normalizeRelease({ ...valid, tag_name: "latest" }),
    null,
  );
});

test("release responses are bounded before JSON is trusted", async () => {
  await assert.rejects(
    updates.readReleaseResponse({
      ok: true,
      headers: { get: () => String(updates.MAX_RESPONSE_BYTES + 1) },
      text: async () => "{}",
    }),
    /过大/,
  );

  await assert.rejects(
    updates.readReleaseResponse({
      ok: true,
      headers: { get: () => null },
      text: async () => "x".repeat(updates.MAX_RESPONSE_BYTES + 1),
    }),
    /过大/,
  );

  let cancelled = false;
  await assert.rejects(
    updates.readReleaseResponse({
      ok: true,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => ({
            done: false,
            value: new Uint8Array(updates.MAX_RESPONSE_BYTES + 1),
          }),
          cancel: async () => {
            cancelled = true;
          },
        }),
      },
    }),
    /过大/,
  );
  assert.equal(cancelled, true);
});

test("status shows only a newer, non-dismissed release or one update receipt", () => {
  const latestRelease = {
    version: "2.1.0",
    title: "看完了 2.1.0",
    notes: ["新增版本提醒"],
    url: "https://github.com/Zhenxiangai/kanwanle/releases/tag/v2.1.0",
    publishedAt: "2026-09-02T08:00:00.000Z",
  };
  const available = updates.buildStatus("2.0.0", { latestRelease });
  assert.equal(available.updateAvailable, true);
  assert.equal(available.showUpdate, true);
  assert.equal(available.latestVersion, "2.1.0");

  const dismissed = updates.buildStatus("2.0.0", {
    latestRelease,
    dismissedVersion: "2.1.0",
  });
  assert.equal(dismissed.updateAvailable, true);
  assert.equal(dismissed.showUpdate, false);

  const updated = updates.buildStatus("2.0.0", {
    justUpdated: { previousVersion: "1.6.0", currentVersion: "2.0.0" },
  });
  assert.equal(updated.justUpdated, true);
  assert.equal(updated.showUpdate, true);
  assert.deepEqual(updated.notes, updates.CURRENT_RELEASE.notes);
});

function createChromeMock({ storedState, updateCheckResult } = {}) {
  const values = storedState
    ? { [updates.STORAGE_KEY]: structuredClone(storedState) }
    : {};
  const badgeTexts = [];
  const openedTabs = [];
  let reloadCount = 0;
  const listener = { addListener() {} };
  return {
    chromeApi: {
      storage: {
        local: {
          get: async (key) => ({ [key]: structuredClone(values[key]) }),
          set: async (next) => Object.assign(values, structuredClone(next)),
        },
      },
      action: {
        setBadgeText: async ({ text }) => badgeTexts.push(text),
        setBadgeBackgroundColor: async () => {},
      },
      tabs: {
        create: async ({ url }) => openedTabs.push(url),
      },
      runtime: {
        getManifest: () => ({ version: "2.0.0" }),
        requestUpdateCheck: async () =>
          updateCheckResult || { status: "no_update" },
        reload: () => {
          reloadCount += 1;
        },
        onInstalled: listener,
        onStartup: listener,
        onUpdateAvailable: listener,
      },
    },
    values,
    badgeTexts,
    openedTabs,
    get reloadCount() {
      return reloadCount;
    },
  };
}

function githubRelease(version = "2.1.0") {
  return {
    tag_name: `v${version}`,
    name: `看完了 ${version}`,
    html_url: `https://github.com/Zhenxiangai/kanwanle/releases/tag/v${version}`,
    published_at: "2026-09-02T08:00:00Z",
    body: "- 新增安全更新提醒\n- 优化 B 站概览",
  };
}

test("browser manager caches GitHub checks and marks a new release", async () => {
  const browser = createChromeMock();
  let fetchCount = 0;
  const manager = updates.createManager({
    chromeApi: browser.chromeApi,
    now: () => 1_800_000_000_000,
    fetchImpl: async () => {
      fetchCount += 1;
      return {
        ok: true,
        headers: { get: () => null },
        text: async () => JSON.stringify(githubRelease()),
      };
    },
  });

  const first = await manager.getStatus();
  const cached = await manager.getStatus();

  assert.equal(first.updateAvailable, true);
  assert.equal(cached.latestVersion, "2.1.0");
  assert.equal(fetchCount, 1);
  assert.ok(browser.badgeTexts.includes("新"));
});

test("unpacked or unavailable store updates open the validated release", async () => {
  const latestRelease = updates.normalizeRelease(githubRelease());
  const browser = createChromeMock({ storedState: { latestRelease } });
  const manager = updates.createManager({
    chromeApi: browser.chromeApi,
    fetchImpl: async () => {
      throw new Error("not used");
    },
  });

  const result = await manager.install();

  assert.equal(result.mode, "manual");
  assert.deepEqual(browser.openedTabs, [latestRelease.url]);
});

test("a downloaded store update reloads only after the user clicks", async () => {
  const latestRelease = updates.normalizeRelease(githubRelease());
  const browser = createChromeMock({
    storedState: {
      latestRelease,
      pendingStoreVersion: "2.1.0",
    },
  });
  let scheduled;
  const manager = updates.createManager({
    chromeApi: browser.chromeApi,
    schedule: (callback) => {
      scheduled = callback;
    },
  });

  const result = await manager.install();
  assert.equal(result.reloading, true);
  assert.equal(browser.reloadCount, 0);
  scheduled();
  assert.equal(browser.reloadCount, 1);
});
