/**
 * Bilibili page integration.
 *
 * The delayed, interval-based injection strategy is adapted from
 * https://github.com/biuworks/bilibili-digest (MIT), copyright 2026 k1234567.
 * Waiting for Bilibili's SSR/Vue hydration avoids forcing the player to rebuild.
 */
(() => {
  "use strict";

  const OVERLAY_ID = "video-digest-bilibili-overlay";
  const DIGEST_BUTTON_ID = "video-digest-bilibili-button";
  const NOTE_BUTTON_ID = "video-digest-bilibili-note-button";
  const NOTE_LABEL_CLASS = "video-digest-bilibili-note-label";
  const REINJECT_INTERVAL_MS = 800;
  const SETTLE_DELAY_MS = 1200;
  const PLAYER_WAIT_TIMEOUT_MS = 15000;
  const PLAYER_POLL_MS = 200;
  let interfaceLanguage = "zh-CN";

  const uiText = (key) =>
    KANWANLE_I18N.translate(interfaceLanguage, key);

  function applyLanguage(preference) {
    interfaceLanguage = KANWANLE_I18N.resolveLanguage(
      preference,
      KANWANLE_I18N.browserLanguage(chrome, navigator),
    );
    const digestButton = document.getElementById(DIGEST_BUTTON_ID);
    if (digestButton) digestButton.textContent = uiText("digest");
    const noteLabel = document
      .getElementById(NOTE_BUTTON_ID)
      ?.querySelector(`.${NOTE_LABEL_CLASS}`);
    if (noteLabel) noteLabel.textContent = `${uiText("noteCapture")} N`;
  }

  async function loadLanguage() {
    try {
      const result = await chrome.runtime.sendMessage({
        action: "getLanguagePreferences",
      });
      if (result?.success) applyLanguage(result.preference);
    } catch (_error) {
      applyLanguage("zh-CN");
    }
  }

  const TOOLBAR_SELECTORS = [
    ".video-toolbar-left",
    ".video-toolbar-container .toolbar-left",
    "#arc_toolbar_report .toolbar-left",
    ".toolbar-left",
    ".video-toolbar-v1 .toolbar-left",
  ];
  const PLAYER_SELECTORS = [
    "#bilibili-player .bpx-player-primary-area",
    "#bilibili-player",
    ".bpx-player-container",
    "#playerWrap",
  ];

  const currentBvid = () => {
    const match = location.href.match(/BV[0-9A-Za-z]{10}/);
    return match ? match[0] : null;
  };

  const currentPage = () => {
    const page = Number(new URL(location.href).searchParams.get("p") || 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
  };

  const currentStorageId = () => {
    const bvid = currentBvid();
    return bvid ? `bilibili:${bvid}:p${currentPage()}` : null;
  };

  const videoElement = () =>
    document.querySelector(".bpx-player-video-wrap video") ||
    document.querySelector("video");

  const firstMatch = (selectors) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  };

  const holdsVideoDirectly = (element) =>
    Array.prototype.some.call(
      element?.children || [],
      (child) => child.tagName === "VIDEO",
    );

  function playerContainer() {
    for (const selector of PLAYER_SELECTORS) {
      const element = document.querySelector(selector);
      if (element && !holdsVideoDirectly(element)) return element;
    }
    return null;
  }

  function readVideoInfo() {
    const titleNode =
      document.querySelector("h1.video-title") ||
      document.querySelector(".video-title") ||
      document.querySelector("h1[title]");
    const ownerNode =
      document.querySelector(".up-info-container .up-name") ||
      document.querySelector("a.up-name") ||
      document.querySelector(".up-name");
    const video = videoElement();
    return {
      title:
        titleNode?.getAttribute("title")?.trim() ||
        titleNode?.textContent?.trim() ||
        document.title.replace(/_哔哩哔哩.*$/, "").trim(),
      channelName: ownerNode?.textContent?.trim() || "",
      description: "",
      duration: Number(video?.duration) || 0,
      bvid: currentBvid(),
      page: currentPage(),
    };
  }

  const BUTTON_BASE = `display:inline-flex;align-items:center;gap:6px;
    padding:6px 14px;border:none;border-radius:6px;cursor:pointer;
    font-size:13px;line-height:1.4;color:#fff;white-space:nowrap;`;

  function styleButton(button, floating) {
    button.style.cssText = floating
      ? `${BUTTON_BASE}background:rgba(251,114,153,.94);box-shadow:0 2px 8px rgba(0,0,0,.2);`
      : `${BUTTON_BASE}background:#fb7299;margin-left:12px;`;
  }

  function ensureOverlay() {
    const player = playerContainer();
    if (!player) return null;
    let overlay = player.querySelector(`#${OVERLAY_ID}`);
    if (overlay?.isConnected) return overlay;
    if (getComputedStyle(player).position === "static") {
      player.style.position = "relative";
    }
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `position:absolute;top:12px;right:12px;z-index:9999;
      display:flex;flex-direction:column;align-items:flex-end;gap:8px;`;
    player.appendChild(overlay);
    return overlay;
  }

  function flashDigestButton(text) {
    const button = document.getElementById(DIGEST_BUTTON_ID);
    if (!button) return;
    button.textContent = text;
    setTimeout(() => {
      if (button.isConnected) button.textContent = uiText("digest");
    }, 2200);
  }

  async function openSidePanel() {
    try {
      const result = await chrome.runtime.sendMessage({ action: "openSidePanel" });
      if (!result?.success) flashDigestButton(uiText("clickExtensionIcon"));
    } catch {
      flashDigestButton(uiText("clickExtensionIcon"));
    }
  }

  function injectDigestButton() {
    if (document.getElementById(DIGEST_BUTTON_ID)?.isConnected) return;
    const button = document.createElement("button");
    button.id = DIGEST_BUTTON_ID;
    button.type = "button";
    button.textContent = uiText("digest");
    button.title = "打开视频摘要侧边栏";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openSidePanel();
    });

    const toolbar = firstMatch(TOOLBAR_SELECTORS);
    if (toolbar) {
      styleButton(button, false);
      toolbar.appendChild(button);
      return;
    }
    const overlay = ensureOverlay();
    if (overlay) {
      styleButton(button, true);
      overlay.appendChild(button);
    }
  }

  function createNoteIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const paths = [
      "M8.6 2.4H4.1c-.6 0-1.1.5-1.1 1.1v8.9c0 .6.5 1.1 1.1 1.1h6.2c.6 0 1.1-.5 1.1-1.1V7.9",
      "M11.2 2.2a1.4 1.4 0 0 1 2 2L9.1 8.3l-2.5.5.5-2.5Z",
    ];
    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }
    return svg;
  }

  function injectNoteButton() {
    if (document.getElementById(NOTE_BUTTON_ID)?.isConnected) return;
    const overlay = ensureOverlay();
    if (!overlay) return;
    const button = document.createElement("button");
    button.id = NOTE_BUTTON_ID;
    button.type = "button";
    button.title = "在当前时间点记笔记（快捷键 N）";
    const label = document.createElement("span");
    label.className = NOTE_LABEL_CLASS;
    label.textContent = uiText("noteCapture");
    const shortcut = document.createElement("kbd");
    shortcut.textContent = "N";
    shortcut.style.cssText = `margin-left:1px;padding:1px 6px;
      border:1px solid rgba(255,255,255,.55);border-radius:5px;
      font:700 10px/1.45 system-ui;background:rgba(255,255,255,.12);`;
    button.append(createNoteIcon(), label, shortcut);
    button.style.cssText = `display:inline-flex;align-items:center;gap:7px;
      padding:9px 16px;border:none;border-radius:999px;
      background:#c8674f;color:#fff;cursor:pointer;white-space:nowrap;
      font:600 13px/1.4 system-ui,-apple-system,"Roboto",sans-serif;
      letter-spacing:.2px;opacity:.92;pointer-events:auto;
      box-shadow:0 4px 14px rgba(0,0,0,.3);
      transition:opacity .18s ease,transform .18s ease,background .18s ease,box-shadow .18s ease;`;
    button.addEventListener("mouseenter", () => {
      button.style.background = "#b25742";
      button.style.boxShadow = "0 6px 18px rgba(0,0,0,.35)";
      button.style.transform = "translateY(-1px)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "#c8674f";
      button.style.boxShadow = "0 4px 14px rgba(0,0,0,.3)";
      button.style.transform = "translateY(0)";
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void saveNoteAtCurrentTime();
    });
    overlay.appendChild(button);
  }

  function injectButtons() {
    if (!currentBvid()) {
      document.getElementById(DIGEST_BUTTON_ID)?.remove();
      document.getElementById(OVERLAY_ID)?.remove();
      return;
    }
    injectDigestButton();
    injectNoteButton();
  }

  let noteCaptureController = null;

  function flashNoteButton(text) {
    const button = document.getElementById(NOTE_BUTTON_ID);
    const label = button?.querySelector(`.${NOTE_LABEL_CLASS}`);
    if (!label) return;
    label.textContent = text;
    setTimeout(() => {
      if (button.isConnected) label.textContent = uiText("noteCapture");
    }, 1800);
  }

  function showNoteFeedback(result) {
    return KANWANLE_NOTES.renderFeedback(document, result, {
      id: "kanwanle-bilibili-note-feedback",
      language: interfaceLanguage,
      onOpenNotes: () =>
        chrome.runtime.sendMessage({
          action: "openSidePanel",
          initialTab: "notes",
        }),
    });
  }

  function getNoteCaptureController() {
    if (!noteCaptureController) {
      noteCaptureController = KANWANLE_NOTES.createCaptureController({
        save: (payload) => chrome.runtime.sendMessage(payload),
        onStateChange(state) {
          if (state.status === "saving") {
            flashNoteButton(uiText("saving"));
          } else if (state.status === "saved") {
            flashNoteButton(uiText("saved"));
            showNoteFeedback({ success: true, note: state.note });
          } else {
            flashNoteButton(uiText("saveFailed"));
            showNoteFeedback({
              success: false,
              error: state.error,
              message: state.message,
            });
          }
        },
      });
    }
    return noteCaptureController;
  }

  async function saveNoteAtCurrentTime() {
    const video = videoElement();
    const bvid = currentBvid();
    const storageId = currentStorageId();
    if (!video || !bvid || !storageId) {
      showNoteFeedback({
        success: false,
        error: "NO_PLAYER",
        message: "没有找到当前 B 站视频播放器，请刷新页面后重试。",
      });
      return;
    }
    const info = readVideoInfo();
    await getNoteCaptureController().capture({
      action: "saveNote",
      videoId: storageId,
      platform: "bilibili",
      sourceVideoId: bvid,
      page: currentPage(),
      videoUrl: location.href,
      timestamp: Math.max(0, Math.floor(video.currentTime || 0) - 3),
      videoTitle: info.title,
      channelName: info.channelName,
    });
  }

  function isTypingTarget(target) {
    return (
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable === true
    );
  }

  function handleKeydown(event) {
    if (event.key !== "n" && event.key !== "N") return;
    if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    void saveNoteAtCurrentTime();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === "getVideoInfo") {
      sendResponse(readVideoInfo());
      return false;
    }
    if (message?.action === "getCurrentTime") {
      const video = videoElement();
      sendResponse({
        currentTime: video ? Math.floor(Number(video.currentTime) || 0) : 0,
        paused: video ? video.paused : true,
      });
      return false;
    }
    if (message?.action === "seekTo") {
      const video = videoElement();
      if (!video) {
        sendResponse({ success: false, error: "NO_PLAYER" });
        return false;
      }
      video.currentTime = Math.max(0, Number(message.seconds) || 0);
      if (video.paused) void video.play().catch(() => {});
      sendResponse({ success: true });
      return false;
    }
    if (message?.action === "highlightMoments") {
      sendResponse({ success: true });
      return false;
    }
    if (message?.action === "showNoteSavedFeedback") {
      flashNoteButton(uiText("saved"));
      showNoteFeedback({ success: true, note: message.note });
      sendResponse({ success: true });
      return false;
    }
    if (message?.action === "languageChanged") {
      applyLanguage(message.preference);
      sendResponse({ success: true });
      return false;
    }
    sendResponse({ success: false, error: "Unknown action" });
    return false;
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function whenWindowLoaded() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) =>
      window.addEventListener("load", resolve, { once: true }),
    );
  }

  async function whenPlayerMounted() {
    const deadline = Date.now() + PLAYER_WAIT_TIMEOUT_MS;
    while (!videoElement() && Date.now() < deadline) await delay(PLAYER_POLL_MS);
  }

  async function init() {
    document.addEventListener("keydown", handleKeydown);
    await loadLanguage();
    await whenWindowLoaded();
    await whenPlayerMounted();
    await delay(SETTLE_DELAY_MS);
    injectButtons();
    setInterval(injectButtons, REINJECT_INTERVAL_MS);
  }

  void init();
})();
