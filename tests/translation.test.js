const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const platforms = require("../platforms.js");
const biliApi = require("../lib/bili-api.js");
const updates = require("../updates.js");
const notes = require("../notes.js");
const i18n = require("../i18n.js");
const brand = require("../brand.js");

function loadSidepanelHelpers({
  sendMessage = () => Promise.resolve({}),
  setTimeoutImpl = () => 0,
  clearTimeoutImpl = () => {},
  documentLike = null,
} = {}) {
  const listeners = { addListener() {} };
  const sessionStorage = {};
  const localStorage = {};
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout: setTimeoutImpl,
    clearTimeout: clearTimeoutImpl,
    setInterval() {},
    clearInterval() {},
    IntersectionObserver: class {},
    CSS: { escape: (value) => value },
    window: { getSelection: () => null, close() {} },
    document: documentLike || {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => {
        let value = "";
        return {
          set textContent(text) {
            value = String(text);
          },
          get innerHTML() {
            return value
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;");
          },
        };
      },
    },
    chrome: {
      runtime: { onMessage: listeners, sendMessage },
      storage: {
        local: {
          get: async (key) => ({ [key]: localStorage[key] }),
          set: async (values) => Object.assign(localStorage, values),
        },
        session: {
          get: async (key) => ({ [key]: sessionStorage[key] }),
          set: async (values) => Object.assign(sessionStorage, values),
        },
      },
      windows: { getCurrent: () => Promise.resolve({ id: 1 }) },
      tabs: {
        onUpdated: listeners,
        onActivated: listeners,
        onRemoved: listeners,
        get: async (tabId) => ({ id: tabId, url: "https://example.com/" }),
      },
    },
    YTD_SETTINGS: {},
    YTD_PLATFORMS: platforms,
    KANWANLA_BRAND: brand,
    KANWANLA_I18N: i18n,
    BILI_API: biliApi,
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("sidepanel.js"), sandbox);
  return sandbox.__YTD_TRANSCRIPT_TESTING__;
}

function loadBackgroundHelpers({
  settings = {
    provider: "siliconflow",
    aiApiKey: "test-key",
    aiBaseUrl: "https://api.siliconflow.cn/v1",
    aiModel: "Qwen/Qwen3-8B",
  },
  fetchImpl = fetch,
  setTimeoutImpl = () => 0,
  clearTimeoutImpl = () => {},
  biliApiImpl = biliApi,
  sidePanel = {
    setPanelBehavior() {},
    setOptions: () => Promise.resolve(),
  },
  initialStorage = {},
} = {}) {
  const listeners = { addListener() {} };
  const localStorage = { ...initialStorage, ytd_settings: settings };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    fetch: fetchImpl,
    AbortController,
    setTimeout: setTimeoutImpl,
    clearTimeout: clearTimeoutImpl,
    importScripts() {},
    chrome: {
      storage: {
        local: {
          setAccessLevel: () => Promise.resolve(),
          get: async (key) => {
            if (key === null) return { ...localStorage };
            if (Array.isArray(key)) {
              return Object.fromEntries(key.map((item) => [item, localStorage[item]]));
            }
            return { [key]: localStorage[key] };
          },
          set: async (values) => Object.assign(localStorage, values),
          remove: async (keys) => {
            for (const key of Array.isArray(keys) ? keys : [keys]) {
              delete localStorage[key];
            }
          },
        },
      },
      action: { onClicked: listeners },
      sidePanel,
      runtime: {
        onInstalled: listeners,
        onMessage: listeners,
        openOptionsPage() {},
        getURL: (resourcePath) => `chrome-extension://test/${resourcePath}`,
        sendMessage: () => Promise.resolve({ success: true }),
      },
      tabs: {
        onUpdated: listeners,
        onActivated: listeners,
        onRemoved: listeners,
        get: async (tabId) => ({ id: tabId, url: "https://example.com/" }),
      },
    },
    YTD_SETTINGS: {
      STORAGE_KEY: "ytd_settings",
      normalize: (value) => value,
      chatCompletionsUrl: (baseUrl) => `${baseUrl}/chat/completions`,
      canonicalYouTubeUrl: (videoId) =>
        `https://www.youtube.com/watch?v=${videoId}`,
    },
    YTD_PLATFORMS: platforms,
    KANWANLA_BRAND: brand,
    KANWANLA_UPDATES: updates,
    KANWANLA_NOTES: notes,
    KANWANLA_I18N: i18n,
    BILI_API: biliApiImpl,
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("background.js"), sandbox);
  return sandbox.__YTD_TRANSLATION_TESTING__;
}

test("non-YouTube tabs explicitly close before their panel is disabled", async () => {
  const calls = [];
  const background = loadBackgroundHelpers({
    sidePanel: {
      setPanelBehavior() {},
      close: async (options) => calls.push(["close", options]),
      setOptions: async (options) => calls.push(["setOptions", options]),
    },
  });

  await background.updatePanelForTab(17, "https://example.com/page", 4);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["close", { tabId: 17 }],
    ["setOptions", { tabId: 17, enabled: false }],
  ]);
});

test("a global panel closes by window when the tab close is rejected", async () => {
  const calls = [];
  const background = loadBackgroundHelpers({
    sidePanel: {
      setPanelBehavior() {},
      close: async (options) => {
        calls.push(["close", options]);
        if (options.tabId) throw new Error("Global panel");
      },
      setOptions: async (options) => calls.push(["setOptions", options]),
    },
  });

  await background.updatePanelForTab(17, "https://example.com/page", 4);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["close", { tabId: 17 }],
    ["close", { windowId: 4 }],
    ["setOptions", { tabId: 17, enabled: false }],
  ]);
});

test("the update banner renders version notes as text and can be hidden", () => {
  const helpers = loadSidepanelHelpers();
  const elements = {
    updateBanner: { hidden: true },
    updateKicker: {},
    updateTitle: {},
    updateVersion: {},
    updatePrimaryBtn: {},
    updateDismissBtn: {},
    updateStatus: {},
  };
  const notes = {
    children: [],
    get firstChild() {
      return this.children[0] || null;
    },
    appendChild(item) {
      this.children.push(item);
    },
    removeChild(item) {
      this.children.splice(this.children.indexOf(item), 1);
    },
  };
  elements.updateNotes = notes;
  const doc = {
    getElementById: (id) => elements[id] || null,
    createElement: () => ({ textContent: "" }),
  };

  helpers.renderUpdateBanner(
    {
      showUpdate: true,
      updateAvailable: true,
      justUpdated: false,
      currentVersion: "2.0.0",
      latestVersion: "2.1.0",
      notes: ["新增 <安全> 更新入口"],
    },
    doc,
  );

  assert.equal(elements.updateBanner.hidden, false);
  assert.equal(elements.updateTitle.textContent, "看完啦 v2.1.0");
  assert.equal(elements.updatePrimaryBtn.textContent, "立即更新");
  assert.equal(notes.children[0].textContent, "新增 <安全> 更新入口");

  helpers.renderUpdateBanner({ showUpdate: false }, doc);
  assert.equal(elements.updateBanner.hidden, true);
});

test("one header click forces a fresh check and opens an available unpacked update", async () => {
  const messages = [];
  const attributes = {};
  const elements = {
    headerUpdateBtn: {
      dataset: {},
      disabled: false,
      setAttribute: (name, value) => {
        attributes[name] = value;
      },
    },
    updatePrimaryBtn: { disabled: false },
    updateStatus: {},
  };
  const documentLike = {
    addEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: (id) => elements[id] || null,
    createElement: () => ({ textContent: "" }),
  };
  const helpers = loadSidepanelHelpers({
    documentLike,
    sendMessage: async (message) => {
      messages.push(message);
      if (message.action === "checkForUpdates") {
        return {
          showUpdate: false,
          updateAvailable: true,
          currentVersion: "2.1.1",
          latestVersion: "2.1.2",
        };
      }
      if (message.action === "installUpdate") {
        return { success: true, mode: "manual", opened: true };
      }
      return {};
    },
  });

  await helpers.handleHeaderUpdateClick();

  assert.deepEqual(
    messages.map((message) => message.action),
    ["checkForUpdates", "installUpdate"],
  );
  assert.equal(elements.headerUpdateBtn.dataset.state, "available");
  assert.equal(elements.headerUpdateBtn.textContent, "新版本 v2.1.2");
  assert.equal(attributes["aria-label"], "新版本 v2.1.2");
});

function createFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay, active: true });
      return id;
    },
    clearTimeout(id) {
      const timer = timers.get(id);
      if (timer) timer.active = false;
    },
    fireActive(delay) {
      const match = [...timers.entries()].find(
        ([, timer]) => timer.active && timer.delay === delay,
      );
      assert.ok(match, `Expected an active ${delay}ms timer`);
      match[1].active = false;
      match[1].callback();
    },
    activeCount(delay) {
      return [...timers.values()].filter(
        (timer) => timer.active && timer.delay === delay,
      ).length;
    },
    createdCount(delay) {
      return [...timers.values()].filter((timer) => timer.delay === delay).length;
    },
  };
}

function streamingResponse(chunks, { ok = true, status = 200 } = {}) {
  let index = 0;
  return {
    ok,
    status,
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) return { done: true };
            return { done: false, value: chunks[index++] };
          },
          async cancel() {},
        };
      },
    },
  };
}

const encode = (value) => new TextEncoder().encode(value);
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

test("the header exposes one universal language control for all result tabs", () => {
  const html = read("sidepanel.html");
  const js = read("sidepanel.js");
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /id="transcriptModeControl"[\s\S]*aria-label="内容语言"/);
  assert.match(html, /id="transcriptModeControl"[\s\S]*id="tabsNav"/);
  assert.match(html, /data-transcript-mode="original"[\s\S]*?>原文</);
  assert.match(html, /data-transcript-mode="zh"[\s\S]*?>\u4e2d\u6587</);
  assert.match(html, /data-transcript-mode="bilingual"[\s\S]*?>\u53cc\u8bed</);
  assert.match(html, /data-tab="transcript"[^>]*>字幕</);
  assert.match(html, /data-tab="overview"[^>]*>概览</);
  assert.match(
    html,
    /data-tab="notes"[\s\S]*?data-ui-i18n="notes">笔记<[\s\S]*?id="notesCount"/,
  );
  assert.match(js, /handleDisplayLanguageModeChange\(button\.dataset\.transcriptMode\)/);
  assert.match(js, /contentType: "transcriptBatch"/);
  assert.match(js, /contentType: "interfaceBatch"/);
  assert.match(js, /translateOverviewContent/);
  assert.match(js, /translateNotesContent/);
  assert.doesNotMatch(js, /English \+ Chinese/);
  assert.doesNotMatch(`${html}\n${js}`, /From video subtitles/);
});

test("new videos default to Chinese while returning videos restore their choice", async () => {
  const { loadDisplayLanguageMode, saveDisplayLanguageMode } =
    loadSidepanelHelpers();

  await saveDisplayLanguageMode("video-a", "bilingual");
  assert.equal(await loadDisplayLanguageMode("video-a"), "bilingual");
  assert.equal(await loadDisplayLanguageMode("unseen-video"), "zh");
});

test("Chinese source subtitles render directly instead of calling the translation provider", () => {
  const { shouldTranslateTranscriptToChinese, renderTranscriptSegmentContent } =
    loadSidepanelHelpers();

  assert.equal(shouldTranslateTranscriptToChinese("zh-CN", "这是中文字幕。"), false);
  assert.equal(shouldTranslateTranscriptToChinese("ai-zh", "这是 AI 中文字幕。"), false);
  assert.equal(shouldTranslateTranscriptToChinese("en", "This is English."), true);
  assert.equal(shouldTranslateTranscriptToChinese("", "纯中文也应直接显示。"), false);

  const rendered = renderTranscriptSegmentContent(
    { text: "这是中文字幕。" },
    "zh",
    "",
    "",
    "zh-CN",
  );
  assert.match(rendered, /这是中文字幕。/);
  assert.doesNotMatch(rendered, /Waiting|Retry|translation-pending/);
});

test("Chinese Overview and Notes content bypass interface translation", () => {
  const { shouldTranslateInterfaceTextToChinese } = loadSidepanelHelpers();
  const js = read("sidepanel.js");

  assert.equal(shouldTranslateInterfaceTextToChinese("这是中文概览。"), false);
  assert.equal(
    shouldTranslateInterfaceTextToChinese("自然健身的 FFMI 23 上限讨论"),
    false,
  );
  assert.equal(
    shouldTranslateInterfaceTextToChinese("This Overview still needs translation."),
    true,
  );
  assert.match(
    js,
    /renderLocalizedContent[\s\S]*?!shouldTranslateInterfaceTextToChinese\(original\)/,
  );
  assert.match(
    js,
    /const missing = segments[\s\S]*?shouldTranslateInterfaceTextToChinese\(segment\.text\)/,
  );
});

test("Overview shares the Transcript batch generation and retries when opened", () => {
  const js = read("sidepanel.js");
  const transcriptFunction = js.match(
    /async function translateTranscript\(\)[\s\S]*?\n}\n\nfunction setTranslatingSpinner/,
  )?.[0];

  assert.ok(transcriptFunction);
  assert.doesNotMatch(transcriptFunction, /translationGeneration \+= 1/);
  assert.match(js, /const TRANSLATION_BATCH_SIZE = 8/);
  assert.match(
    js,
    /const batch = missing\.slice\(start, start \+ TRANSLATION_BATCH_SIZE\)[\s\S]*?rerender\(\);[\s\S]*?await updateCache\(\)/,
  );
  assert.match(
    js,
    /tabName === "overview"[\s\S]*?currentAnalysis[\s\S]*?currentTranscriptMode !== "original"[\s\S]*?translateOverviewContent\(\)/,
  );
  assert.match(
    js,
    /Translate only the visible tab[\s\S]*?tabName === "notes"[\s\S]*?translateNotesContent\(\)/,
  );
  assert.match(
    js,
    /activeTabName === "overview"[\s\S]*?translateOverviewContent\(\)[\s\S]*?activeTabName === "notes"[\s\S]*?translateNotesContent\(\)[\s\S]*?activeTabName === "transcript"[\s\S]*?translateTranscript\(\)/,
  );
});

test("Overview exits loading and shows a retryable error when its runtime message stalls", async () => {
  const source = read("sidepanel.js");
  const runtimeWatchdog =
    source.match(
      /function sendRuntimeMessageWithTimeout\([\s\S]*?^}\n/m,
    )?.[0] || "";
  const triggerAnalysisSource = source.match(
    /async function triggerAnalysis\(\) \{[\s\S]*?^}\n/m,
  )?.[0];
  assert.ok(triggerAnalysisSource, "Expected the real Overview trigger function");

  const chapterList = { innerHTML: "" };
  const quotesList = { innerHTML: "" };
  const timeoutDelays = [];
  const sandbox = {
    console: { error() {} },
    queueMicrotask,
    setTimeout(callback, delay) {
      timeoutDelays.push(delay);
      queueMicrotask(callback);
      return timeoutDelays.length;
    },
    clearTimeout() {},
    document: {
      getElementById(id) {
        return id === "chapterList"
          ? chapterList
          : id === "quotesList"
            ? quotesList
            : null;
      },
    },
    chrome: {
      runtime: {
        sendMessage: () => new Promise(() => {}),
      },
    },
    currentTranscriptTimestamped: "[00:00] Test transcript",
    currentVideoTitle: "Test video",
    currentChannelName: "Test channel",
    currentVideoDescription: "Test description",
    currentVideoDuration: 60,
    currentVideoId: "test-video",
    currentVideoRef: { platform: "bilibili" },
    currentAnalysis: null,
    isAnalysisLoading: false,
    ANALYSIS_MESSAGE_TIMEOUT_MS: 195_000,
    escapeHtml: (value) => String(value),
    renderAnalysisProgress() {},
    renderAnalysisResults() {},
    highlightMomentsOnPage() {},
    saveToCache: async () => {},
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(
    `${runtimeWatchdog}\n${triggerAnalysisSource}\n` +
      "globalThis.__analysisHarness = { triggerAnalysis, get loading() { return isAnalysisLoading; } };",
    sandbox,
  );

  const result = await Promise.race([
    sandbox.__analysisHarness.triggerAnalysis().then(() => "settled"),
    new Promise((resolve) => setTimeout(() => resolve("stuck"), 50)),
  ]);

  assert.equal(result, "settled", "Overview remained permanently loading");
  assert.equal(sandbox.__analysisHarness.loading, false);
  assert.ok(timeoutDelays.includes(195_000));
  assert.match(chapterList.innerHTML, /概览请求等待超过 195 秒，请重试/);
  assert.match(quotesList.innerHTML, /概览请求等待超过 195 秒，请重试/);
});

test("transcript reading position survives a side panel close", async () => {
  const { saveTranscriptViewState, loadTranscriptViewState } =
    loadSidepanelHelpers();

  await saveTranscriptViewState("video-a", 427.5);
  const restored = await loadTranscriptViewState("video-a");

  assert.deepEqual(JSON.parse(JSON.stringify(restored)), {
    videoId: "video-a",
    scrollTop: 427.5,
  });
});

test("selected transcript notes keep exact text and row timestamp", async () => {
  const providerMustNotRun = async () => {
    throw new Error("Selected note must not call a provider");
  };
  const { handleSaveNote } = loadBackgroundHelpers({
    fetchImpl: providerMustNotRun,
  });

  const result = await handleSaveNote(
    "video123abc",
    92.9,
    "Test video",
    "Test channel",
    "  The selected words stay exact.  ",
  );

  assert.equal(result.success, true);
  assert.equal(result.note.text, "The selected words stay exact.");
  assert.equal(result.note.rawText, "The selected words stay exact.");
  assert.equal(result.note.timestamp, "1:32");
  assert.equal(result.note.timestampSeconds, 92);
  assert.equal(
    result.note.timestampedUrl,
    "https://www.youtube.com/watch?v=video123abc&t=92s",
  );
});

test("selection questions are bounded and included in the explanation request", async () => {
  let aiRequest = null;
  const fetchImpl = async (url, options = {}) => {
    if (String(url).startsWith("chrome-extension://")) {
      return {
        ok: true,
        text: async () => read("prompts/explain.md"),
      };
    }
    aiRequest = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "针对问题的回答" } }],
      }),
    };
  };
  const helpers = loadBackgroundHelpers({ fetchImpl });

  assert.equal(
    helpers.normalizeSelectionQuestion(`  ${"疑问 ".repeat(200)}  `).length,
    500,
  );
  const result = await helpers.handleExplainSelection(
    "被选中的原文",
    "有限的上下文",
    "测试视频",
    "这段话在实际工作中应该怎么用？",
    { videoId: "video123abc", timestamp: 92 },
  );

  assert.equal(result.success, true);
  assert.match(aiRequest.messages[1].content, /这段话在实际工作中应该怎么用/);
  assert.match(aiRequest.messages[1].content, /被选中的原文/);
});

test("selection UI asks an optional question before submitting", () => {
  const source = read("sidepanel.js");
  assert.match(source, /id="explainQuestion"/);
  assert.match(source, /maxlength="500"/);
  assert.match(source, /userQuestion:/);
  assert.match(source, /timestamp: selectedTimestamp/);
});

test("timed notes persist from cached captions without calling the AI provider", async () => {
  let providerCalls = 0;
  const providerMustNotRun = async () => {
    providerCalls += 1;
    throw new Error("A note save must not wait for a model");
  };
  const { handleSaveNote } = loadBackgroundHelpers({
    fetchImpl: providerMustNotRun,
    initialStorage: {
      digest_video123abc: {
        transcript: [
          { start: 80, text: "前一句。" },
          { start: 90, text: "这是用户刚刚听到的重点。" },
          { start: 96, text: "下一句。" },
        ],
      },
    },
  });

  const result = await handleSaveNote(
    "video123abc",
    92,
    "Test video",
    "Test channel",
  );

  assert.equal(result.success, true);
  assert.equal(providerCalls, 0);
  assert.match(result.note.text, /用户刚刚听到的重点/);
  assert.equal(result.note.rawText, "这是用户刚刚听到的重点。");
});

test("Bilibili transcript routing does not require Supadata", async () => {
  const fakeBiliApi = {
    parseBvid: (value) => value,
    fetchVideoInfo: async (bvid, { page }) => ({
      bvid,
      aid: 11,
      cid: 22,
      page,
      title: "第二集",
      description: "简介",
      owner: "测试 UP",
      duration: 120,
      pageCount: 2,
    }),
    fetchSubtitleTracks: async () => ({
      tracks: [
        {
          lang: "zh-CN",
          langLabel: "中文",
          url: "https://i0.hdslb.com/subtitle.json",
          isAi: false,
        },
      ],
      needLogin: false,
    }),
    pickSubtitleTrack: (tracks) => tracks[0],
    fetchSubtitleTrackContent: async () => [
      { text: "第一句", start: 0, duration: 2.5 },
      { text: "第二句", start: 2.5, duration: 2.5 },
    ],
  };
  const { handleFetchTranscript } = loadBackgroundHelpers({
    settings: {
      provider: "siliconflow",
      aiApiKey: "test-key",
      aiBaseUrl: "https://api.siliconflow.cn/v1",
      aiModel: "Qwen/Qwen3-8B",
      supadataApiKey: "",
    },
    biliApiImpl: fakeBiliApi,
    fetchImpl: async () => {
      throw new Error("The Bilibili adapter should not call Supadata");
    },
  });

  const result = await handleFetchTranscript("BV1GJ411x7h7", {
    platform: "bilibili",
    page: 2,
  });

  assert.equal(result.success, true);
  assert.equal(result.transcript.length, 2);
  assert.equal(result.transcriptTextTimestamped, "[0:00] 第一句\n[0:02] 第二句");
  assert.equal(result.videoInfo.title, "第二集");
  assert.equal(result.videoInfo.page, 2);
});

test("cached Bilibili transcripts are upgraded to the readable punctuation format", () => {
  const { upgradeCachedBilibiliTranscript } = loadSidepanelHelpers();
  const original = {
    transcript: [
      {
        text: "这是旧缓存里一整段没有任何标点的中文字幕所以更新后也要立即变得好读",
        start: 65,
        duration: 30,
      },
    ],
    transcriptText: "旧文本",
    transcriptTimestamped: "旧时间文本",
  };

  const upgraded = upgradeCachedBilibiliTranscript(original);

  assert.notEqual(upgraded, original);
  assert.match(upgraded.transcript[0].text, /[，。！？]/);
  assert.match(upgraded.transcriptTimestamped, /^\[1:05\]/);
  assert.equal(upgraded.bilibiliTranscriptFormatVersion, 1);
});

test("YouTube AI transcription fallback is explicit and uses Supadata auto mode", async () => {
  let requestedUrl = "";
  const { handleFetchTranscript } = loadBackgroundHelpers({
    settings: {
      provider: "siliconflow",
      aiApiKey: "test-key",
      aiBaseUrl: "https://api.siliconflow.cn/v1",
      aiModel: "Qwen/Qwen3-8B",
      supadataApiKey: "test-supadata-key",
      youtubeTranscriptMode: "auto",
    },
    fetchImpl: async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          content: [
            { text: "Generated transcript.", offset: 0, duration: 1000, lang: "en" },
          ],
          lang: "en",
          availableLangs: ["en"],
        }),
      };
    },
  });

  const result = await handleFetchTranscript("video123abc", {
    platform: "youtube",
  });

  assert.equal(result.success, true);
  assert.equal(new URL(requestedUrl).searchParams.get("mode"), "auto");
});

test("Bilibili login-only subtitles return a distinct action message", async () => {
  const fakeBiliApi = {
    parseBvid: (value) => value,
    fetchVideoInfo: async (bvid) => ({ bvid, aid: 1, cid: 2, page: 1 }),
    fetchSubtitleTracks: async () => ({ tracks: [], needLogin: true }),
  };
  const { handleFetchTranscript } = loadBackgroundHelpers({
    biliApiImpl: fakeBiliApi,
  });
  const result = await handleFetchTranscript("BV1GJ411x7h7", {
    platform: "bilibili",
    page: 1,
  });
  assert.equal(result.success, false);
  assert.equal(result.error, "BILIBILI_LOGIN_REQUIRED");
  assert.match(result.message, /登录/);
});

test("Bilibili selected notes preserve the part and timestamp deep link", async () => {
  const { handleSaveNote } = loadBackgroundHelpers();
  const result = await handleSaveNote(
    "bilibili:BV1GJ411x7h7:p2",
    95,
    "第二集",
    "测试 UP",
    "原样保存这句话",
    {
      platform: "bilibili",
      sourceVideoId: "BV1GJ411x7h7",
      page: 2,
    },
  );
  assert.equal(result.success, true);
  assert.equal(result.note.platform, "bilibili");
  assert.equal(
    result.note.timestampedUrl,
    "https://www.bilibili.com/video/BV1GJ411x7h7?p=2&t=95",
  );
});

test("timed-note transcript failures keep their actionable provider reason", async () => {
  const fakeBiliApi = {
    parseBvid: (value) => value,
    fetchVideoInfo: async (bvid) => ({ bvid, aid: 1, cid: 2, page: 1 }),
    fetchSubtitleTracks: async () => ({ tracks: [], needLogin: true }),
  };
  const { handleSaveNote } = loadBackgroundHelpers({
    biliApiImpl: fakeBiliApi,
  });

  const result = await handleSaveNote(
    "bilibili:BV1GJ411x7h7:p1",
    30,
    "测试视频",
    "测试 UP",
    "",
    {
      platform: "bilibili",
      sourceVideoId: "BV1GJ411x7h7",
      page: 1,
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.error, "BILIBILI_LOGIN_REQUIRED");
  assert.match(result.message, /登录/);
});

test("semantic segmentation rebuilds sentences across caption boundaries", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const segments = groupTranscriptEntries(
    [
      { start: 0, text: "Caption boundaries should" },
      { start: 2, text: "not break a complete sentence." },
      { start: 5, text: "The next thought also" },
      { start: 7, text: "stays together!" },
    ],
    { minChars: 1, idealChars: 100, maxChars: 320, maxSeconds: 20 },
  );
  assert.equal(segments.length, 2);
  assert.equal(
    segments[0].text,
    "Caption boundaries should not break a complete sentence.",
  );
  assert.equal(segments[0].start, 0);
  assert.equal(segments[1].text, "The next thought also stays together!");
  assert.equal(segments[1].start, 5);
});

test("a huge raw Supadata entry is split into seekable bounded segments", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const text = Array.from({ length: 900 }, (_, index) => `word${index}`).join(" ");
  const segments = groupTranscriptEntries([
    { start: 12, duration: 90, text },
  ]);
  assert.ok(segments.length > 8);
  assert.ok(segments.every((segment) => segment.text.length <= 384));
  assert.equal(segments[0].start, 12);
  assert.ok(segments.at(-1).start > segments[0].start);
  assert.ok(segments.every((segment) => /^segment-\d+-\d+$/.test(segment.id)));
});

test("Chinese sentence and clause punctuation creates semantic guardrails", () => {
  const { groupTranscriptEntries } = loadSidepanelHelpers();
  const segments = groupTranscriptEntries(
    [
      { start: 0, text: "这是一个被字幕切开的" },
      { start: 2, text: "完整句子。这是第二个想法，" },
      { start: 5, text: "也应该保持语义完整！" },
    ],
    { minChars: 1, idealChars: 100, maxChars: 320, maxSeconds: 20 },
  );
  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, "这是一个被字幕切开的完整句子。");
  assert.equal(segments[1].text, "这是第二个想法，也应该保持语义完整！");
});

test("structured translation batches align by stable ID and expose missing fallback", () => {
  const sidepanel = loadSidepanelHelpers();
  const background = loadBackgroundHelpers();
  const source = [
    { id: "segment-0-0", text: "A complete first sentence." },
    { id: "segment-1-5000", text: "A complete second sentence." },
  ];
  assert.deepEqual(
    JSON.parse(JSON.stringify(background.validateTranscriptBatchRequest({ segments: source }))),
    source,
  );

  const normalized = background.normalizeTranslatedSegmentBatch(
    {
      segments: [
        { id: "unknown", text: "\u5ffd\u7565" },
        { id: "segment-1-5000", text: "\u7b2c\u4e8c\u4e2a\u5b8c\u6574\u53e5\u5b50\u3002" },
      ],
    },
    source,
  );
  const aligned = sidepanel.alignTranslatedSegmentBatch(
    source,
    normalized.segments,
  );
  assert.equal(aligned[0].id, source[0].id);
  assert.equal(aligned[0].text, "");
  assert.match(aligned[0].error, /暂时无法翻译/);
  assert.equal(aligned[1].text, "\u7b2c\u4e8c\u4e2a\u5b8c\u6574\u53e5\u5b50\u3002");
});

test("translated-only omits English while bilingual renders aligned English and Chinese", () => {
  const { renderTranscriptSegmentContent } = loadSidepanelHelpers();
  const segment = { id: "segment-0-0", text: "Original English sentence." };
  const translatedOnly = renderTranscriptSegmentContent(
    segment,
    "zh",
    "\u4e2d\u6587\u8bd1\u6587\u3002",
    "",
  );
  const bilingual = renderTranscriptSegmentContent(
    segment,
    "bilingual",
    "\u4e2d\u6587\u8bd1\u6587\u3002",
    "",
  );
  assert.doesNotMatch(translatedOnly, /Original English sentence/);
  assert.match(translatedOnly, /\u4e2d\u6587\u8bd1\u6587/);
  assert.match(bilingual, /transcript-original/);
  assert.match(bilingual, /Original English sentence/);
  assert.match(bilingual, /\u4e2d\u6587\u8bd1\u6587/);
});

test("subtitle formatting tags render in original and translated segment text", () => {
  const { renderTranscriptSegmentContent } = loadSidepanelHelpers();
  const html = renderTranscriptSegmentContent(
    {
      id: "segment-0-0",
      text: "Think <i>deeply</i>, <b>carefully</b>, and <u>clearly</u>.<br>Next line.",
    },
    "bilingual",
    "\u5b57\u5730<i>\u601d\u8003</i>\u7684\u3002<strong>\u91cd\u70b9</strong>",
    "",
  );

  assert.match(html, /Think <i>deeply<\/i>/);
  assert.match(html, /<b>carefully<\/b>/);
  assert.match(html, /<u>clearly<\/u>\.<br>Next line/);
  assert.match(html, /\u5b57\u5730<i>\u601d\u8003<\/i>\u7684\u3002<strong>\u91cd\u70b9<\/strong>/);
});

test("subtitle markup renderer keeps attributed and arbitrary HTML escaped", () => {
  const { renderSubtitleInlineMarkup } = loadSidepanelHelpers();
  const html = renderSubtitleInlineMarkup(
    '<img src=x onerror="alert(1)"><i onclick="alert(2)">unsafe</i><script>alert(3)</script>',
  );

  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /&lt;i onclick=&quot;alert\(2\)&quot;&gt;unsafe<\/i>/);
  assert.match(html, /&lt;script&gt;alert\(3\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img\b|<i\s+onclick|<script\b/);
});

test("background rejects unsupported language fallthrough and malformed batches", () => {
  const source = read("background.js");
  const { validateTranscriptBatchRequest } = loadBackgroundHelpers();
  assert.match(source, /targetLanguage !== "zh"/);
  assert.match(source, /\["transcriptBatch", "interfaceBatch"\]/);
  assert.throws(
    () => validateTranscriptBatchRequest({ segments: [] }),
    /1 to 8 segments/,
  );
  assert.doesNotThrow(() =>
    validateTranscriptBatchRequest({
      segments: Array.from({ length: 8 }, (_, index) => ({
        id: `segment-${index}`,
        text: `Source sentence ${index}.`,
      })),
    }),
  );
  assert.throws(
    () =>
      validateTranscriptBatchRequest({
        segments: [
          { id: "duplicate", text: "first" },
          { id: "duplicate", text: "second" },
        ],
      }),
    /unique and stable/,
  );
});

test("all AI product requests use the selected SiliconFlow model and JSON behavior", async () => {
  const siliconFlowRequests = [];
  const successfulFetch = (requests) => async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "translated" } }],
      }),
    };
  };

  const siliconFlow = loadBackgroundHelpers({
    fetchImpl: successfulFetch(siliconFlowRequests),
  });
  const siliconFlowResult = await siliconFlow.requestAiCompletion({
    maxTokens: 128,
    responseFormat: { type: "json_object" },
    messages: [{ role: "user", content: "Hello." }],
  });
  assert.equal(siliconFlowResult.text, "translated");
  assert.equal(siliconFlowRequests[0].model, "Qwen/Qwen3-8B");
  assert.equal(Object.hasOwn(siliconFlowRequests[0], "thinking"), false);
  assert.deepEqual(siliconFlowRequests[0].response_format, {
    type: "json_object",
  });

  const backgroundSource = read("background.js");
  assert.equal(
    (backgroundSource.match(/await requestAiCompletion\(\{/g) || []).length,
    4,
  );
  assert.doesNotMatch(backgroundSource, /disableThinking/);
  for (const callPath of [
    "handleAnalyzeTranscript",
    "cleanupNoteText",
    "handleExplainSelection",
    "callAiTranslation",
  ]) {
    assert.match(
      backgroundSource,
      new RegExp(`async function ${callPath}\\([\\s\\S]*?requestAiCompletion\\(\\{`),
    );
  }
});

test("Overview enables SiliconFlow SSE and assembles streamed JSON content", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return streamingResponse([
        encode(
          'data: {"choices":[{"delta":{"reasoning_content":"thinking"}}]}\n\n',
        ),
        encode(
          'data: {"choices":[{"delta":{"content":"{\\"chapters\\":[],"}}]}\n\n',
        ),
        encode(
          'data: {"choices":[{"delta":{"content":"\\"keyQuotes\\":[]}"}}]}\n\n',
        ),
        encode("data: [DONE]\n\n"),
      ]);
    },
  });

  const result = await helpers.requestAiCompletion({
    stream: true,
    thinkingBudget: 1024,
    maxTokens: 4096,
    responseFormat: { type: "json_object" },
    messages: [{ role: "user", content: "Create an overview." }],
  });

  assert.equal(requests[0].stream, true);
  assert.equal(requests[0].thinking_budget, 1024);
  assert.equal(result.text, '{"chapters":[],"keyQuotes":[]}');
  const analysisFunction = read("background.js").match(
    /async function handleAnalyzeTranscript\([\s\S]*?^}\n/m,
  )?.[0];
  assert.ok(analysisFunction);
  assert.match(
    analysisFunction,
    /requestAiCompletion\(\{[\s\S]*?stream:\s*true/,
  );
  assert.match(
    analysisFunction,
    /requestAiCompletion\(\{[\s\S]*?maxTokens:\s*isBilibili\s*\?\s*1536\s*:\s*4096/,
  );
  assert.match(
    analysisFunction,
    /requestAiCompletion\(\{[\s\S]*?thinkingBudget:\s*isBilibili\s*\?\s*128\s*:\s*1024/,
  );
});

test("Bilibili overview request stays within the fast-path budget", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (url, options = {}) => {
      if (String(url).startsWith("chrome-extension://")) {
        return {
          ok: true,
          text: async () => read("prompts/analysis.md"),
        };
      }

      requests.push(JSON.parse(options.body));
      const analysis = JSON.stringify({
        chapters: [],
        keyQuotes: [],
        keyMoments: [],
      });
      return streamingResponse([
        encode(
          "data: " +
            JSON.stringify({ choices: [{ delta: { content: analysis } }] }) +
            "\n\n",
        ),
        encode("data: [DONE]\n\n"),
      ]);
    },
  });

  const transcript = Array.from({ length: 1200 }, (_value, index) => {
    const seconds = Math.round((index * 7198) / 1199);
    const timestamp =
      Math.floor(seconds / 60) +
      ":" +
      String(seconds % 60).padStart(2, "0");
    return (
      "[" +
      timestamp +
      "] 这是一个用于复现长视频概览延迟的中文字幕片段，内容保持完整。"
    );
  }).join("\n");

  const result = await helpers.handleAnalyzeTranscript(
    transcript,
    "B 站长视频测试",
    "测试频道",
    "",
    7200,
    "bilibili",
  );

  assert.equal(result.success, true);
  assert.equal(requests.length, 1);
  const request = requests[0];
  const promptChars = request.messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  assert.ok(
    promptChars <= 32_000,
    "Bilibili overview prompt should be compact enough for a fast request; got " +
      promptChars +
      " characters",
  );
  assert.match(
    request.messages.map((message) => message.content).join("\n"),
    /\[119:58\]/,
  );
  assert.ok(request.max_tokens <= 1536);
  assert.ok((request.thinking_budget || 0) <= 128);
});

test("Bilibili overview hard-caps unusually large individual cues", () => {
  const helpers = loadBackgroundHelpers();
  const compacted = helpers.compactBilibiliAnalysisTranscript(
    "[0:00] " + "开".repeat(40_000) + "\n[99:59] " + "尾".repeat(40_000),
  );

  assert.ok(compacted.length <= 24_000);
  assert.match(compacted, /^\[0:00\]/);
  assert.match(compacted, /\[99:59\]/);
});

test("Overview ignores a large reasoning stream while bounding final content", async () => {
  const reasoning = "r".repeat(2 * 1024 * 1024 + 1);
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([
        encode(
          `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: reasoning } }] })}\n\n`,
        ),
        encode(
          'data: {"choices":[{"delta":{"content":"{\\"chapters\\":[],\\"keyQuotes\\":[]}"}}]}\n\n',
        ),
        encode("data: [DONE]\n\n"),
      ]),
  });

  const result = await helpers.requestAiCompletion({
    stream: true,
    maxTokens: 4096,
    messages: [{ role: "user", content: "Create an overview." }],
  });

  assert.equal(result.text, '{"chapters":[],"keyQuotes":[]}');
});

test("Overview still rejects final streamed content over 2 MiB", async () => {
  const content = "x".repeat(2 * 1024 * 1024 + 1);
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([
        encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`,
        ),
        encode("data: [DONE]\n\n"),
      ]),
  });

  await assert.rejects(
    helpers.requestAiCompletion({
      stream: true,
      maxTokens: 4096,
      messages: [{ role: "user", content: "Create an overview." }],
    }),
    (error) =>
      error?.code === "AI_RESPONSE_TOO_LARGE" &&
      /概览内容超过 2 MiB/.test(error.message),
  );
});

test("unsupported thinking_budget is retried once without changing models", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      requests.push(body);
      if (Object.hasOwn(body, "thinking_budget")) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            error: { message: "thinking_budget is unsupported for this model" },
          }),
        };
      }
      return streamingResponse([
        encode(
          'data: {"choices":[{"delta":{"content":"{\\"chapters\\":[],\\"keyQuotes\\":[]}"}}]}\n\n',
        ),
        encode("data: [DONE]\n\n"),
      ]);
    },
  });

  const result = await helpers.requestAiCompletion({
    stream: true,
    thinkingBudget: 1024,
    maxTokens: 4096,
    messages: [{ role: "user", content: "Create an overview." }],
  });

  assert.equal(result.text, '{"chapters":[],"keyQuotes":[]}');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].model, requests[1].model);
  assert.equal(requests[0].thinking_budget, 1024);
  assert.equal(Object.hasOwn(requests[1], "thinking_budget"), false);
});

test("blank-line chunks reset provider idle timeout and valid JSON succeeds", async () => {
  const timers = createFakeTimers();
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async () =>
      streamingResponse([
        encode("\n"),
        encode("\n"),
        encode('{"choices":[{"message":{"content":"translated"}}]}'),
      ]),
  });

  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, true);
  assert.equal(result.text, "translated");
  assert.equal(timers.createdCount(90_000), 5);
  assert.equal(timers.activeCount(90_000), 0);
  assert.equal(timers.activeCount(180_000), 0);
});

test("provider idle silence aborts with a distinct Retry-able error", async () => {
  const timers = createFakeTimers();
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async (_url, { signal }) => ({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () =>
            new Promise((_resolve, reject) => {
              signal.addEventListener("abort", () => {
                const error = new Error("aborted");
                error.name = "AbortError";
                reject(error);
              });
            }),
        }),
      },
    }),
  });

  const request = helpers.callAiTranslation("Translate.", "Hello.");
  await nextTurn();
  timers.fireActive(90_000);
  const result = await request;
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_IDLE_TIMEOUT");
  assert.match(result.error, /90 秒.*重试/);
  assert.equal(timers.activeCount(180_000), 0);
});

test("blank-line keepalives cannot evade the provider hard cap", async () => {
  const timers = createFakeTimers();
  let releaseRead;
  let signal;
  const helpers = loadBackgroundHelpers({
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout,
    fetchImpl: async (_url, options) => {
      signal = options.signal;
      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: () =>
              new Promise((resolve, reject) => {
                releaseRead = () => resolve({ done: false, value: encode("\n") });
                signal.addEventListener("abort", () => {
                  const error = new Error("aborted");
                  error.name = "AbortError";
                  reject(error);
                }, { once: true });
              }),
          }),
        },
      };
    },
  });

  const request = helpers.callAiTranslation("Translate.", "Hello.");
  await nextTurn();
  releaseRead();
  await nextTurn();
  releaseRead();
  await nextTurn();
  assert.equal(timers.activeCount(90_000), 1);
  timers.fireActive(180_000);
  const result = await request;
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_HARD_TIMEOUT");
  assert.match(result.error, /180 秒.*重试/);
  assert.equal(timers.activeCount(90_000), 0);
});

test("provider response reader accepts leading whitespace before JSON", async () => {
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([
        encode('  \n\t{"choices":[{"message":{"content":"ok"}}]}'),
      ]),
  });
  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, true);
  assert.equal(result.text, "ok");
});

test("provider response reader rejects bodies over 2 MiB", async () => {
  const helpers = loadBackgroundHelpers({
    fetchImpl: async () =>
      streamingResponse([new Uint8Array(2 * 1024 * 1024 + 1)]),
  });
  const result = await helpers.callAiTranslation("Translate.", "Hello.");
  assert.equal(result.success, false);
  assert.equal(result.code, "AI_RESPONSE_TOO_LARGE");
  assert.match(result.error, /2 MiB.*限制/);
});

test("SiliconFlow retries one empty transcript JSON response without response_format", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (url, options) => {
      if (url.startsWith("chrome-extension://")) {
        return { ok: true, text: async () => read("prompts/translation.md") };
      }
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: requests.length === 1
                ? ""
                : '{"segments":[{"id":"segment-0-0","text":"\u4e2d\u6587\u8bd1\u6587\u3002"}]}',
            },
          }],
        }),
      };
    },
  });
  const result = await helpers.handleTranslateContent(
    { segments: [{ id: "segment-0-0", text: "English source sentence." }] },
    "transcriptBatch",
    "zh",
    "Video",
  );
  assert.equal(result.success, true);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].response_format, { type: "json_object" });
  assert.equal(Object.hasOwn(requests[1], "response_format"), false);
  assert.equal(requests[0].max_tokens, 3072);
});

test("interface batches use the dedicated Overview and Notes translation prompt", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: async (url, options) => {
      if (url.startsWith("chrome-extension://")) {
        return { ok: true, text: async () => read("prompts/translation.md") };
      }
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"segments":[{"id":"note-1","text":"\u4e2d\u6587\u7b14\u8bb0\u3002"}]}',
            },
          }],
        }),
      };
    },
  });

  const result = await helpers.handleTranslateContent(
    { segments: [{ id: "note-1", text: "Saved note." }] },
    "interfaceBatch",
    "zh",
    "Video",
  );

  assert.equal(result.success, true);
  assert.equal(result.translatedContent.segments[0].text, "\u4e2d\u6587\u7b14\u8bb0\u3002");
  assert.match(
    requests[0].messages[0].content,
    /chapter titles, summaries, quotes, and saved notes/,
  );
});

test("translation message watchdog rejects, clears its timer, and ignores late replies", async () => {
  let timeoutCallback;
  let timeoutDelay;
  let resolveMessage;
  let clearCount = 0;
  const helpers = loadSidepanelHelpers({
    sendMessage: () =>
      new Promise((resolve) => {
        resolveMessage = resolve;
      }),
    setTimeoutImpl(callback, delay) {
      timeoutCallback = callback;
      timeoutDelay = delay;
      return 73;
    },
    clearTimeoutImpl(id) {
      assert.equal(id, 73);
      clearCount += 1;
    },
  });

  const request = helpers.sendTranslationMessage({
    action: "translateContent",
  });
  assert.equal(timeoutDelay, 195_000);
  timeoutCallback();
  await assert.rejects(request, /翻译请求等待超过 195 秒.*重试/);
  assert.equal(clearCount, 1);

  resolveMessage({ success: true });
  await Promise.resolve();
  assert.equal(clearCount, 1);

  let successTimeoutCallback;
  let successClearCount = 0;
  const successfulHelpers = loadSidepanelHelpers({
    sendMessage: () => Promise.resolve({ success: true }),
    setTimeoutImpl(callback) {
      successTimeoutCallback = callback;
      return 91;
    },
    clearTimeoutImpl(id) {
      assert.equal(id, 91);
      successClearCount += 1;
    },
  });
  assert.deepEqual(
    await successfulHelpers.sendTranslationMessage({
      action: "translateContent",
    }),
    { success: true },
  );
  assert.equal(successClearCount, 1);
  successTimeoutCallback();
  assert.equal(successClearCount, 1);
});

test("Chinese prompt preserves natural bilingual-learning style rules", () => {
  const prompt = read("prompts/translation.md");
  assert.match(prompt, /Translate the complete thought/);
  assert.match(prompt, /Use 你, never 您/);
  assert.match(prompt, /spaces between Chinese and adjacent English words or digits/);
  assert.match(prompt, /source-language `text`/);
});
