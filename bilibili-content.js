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
      if (button.isConnected) button.textContent = "摘要";
    }, 2200);
  }

  async function openSidePanel() {
    try {
      const result = await chrome.runtime.sendMessage({ action: "openSidePanel" });
      if (!result?.success) flashDigestButton("请点击扩展图标");
    } catch {
      flashDigestButton("请点击扩展图标");
    }
  }

  function injectDigestButton() {
    if (document.getElementById(DIGEST_BUTTON_ID)?.isConnected) return;
    const button = document.createElement("button");
    button.id = DIGEST_BUTTON_ID;
    button.type = "button";
    button.textContent = "摘要";
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
    button.title = "在当前时间点记笔记（快捷键 n）";
    const label = document.createElement("span");
    label.className = NOTE_LABEL_CLASS;
    label.textContent = "笔记";
    button.append(createNoteIcon(), label);
    styleButton(button, true);
    button.style.background = "rgba(0,0,0,.58)";
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

  let noteInFlight = false;

  function flashNoteButton(text) {
    const button = document.getElementById(NOTE_BUTTON_ID);
    const label = button?.querySelector(`.${NOTE_LABEL_CLASS}`);
    if (!label) return;
    label.textContent = text;
    setTimeout(() => {
      if (button.isConnected) label.textContent = "笔记";
    }, 1800);
  }

  async function saveNoteAtCurrentTime() {
    const video = videoElement();
    const bvid = currentBvid();
    const storageId = currentStorageId();
    if (!video || !bvid || !storageId || noteInFlight) return;
    const info = readVideoInfo();
    noteInFlight = true;
    flashNoteButton("保存中…");
    try {
      const result = await chrome.runtime.sendMessage({
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
      flashNoteButton(result?.success ? "已保存" : "保存失败");
    } catch {
      flashNoteButton("保存失败");
    } finally {
      noteInFlight = false;
    }
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
      flashNoteButton("已保存");
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
    await whenWindowLoaded();
    await whenPlayerMounted();
    await delay(SETTLE_DELAY_MS);
    injectButtons();
    setInterval(injectButtons, REINJECT_INTERVAL_MS);
  }

  void init();
})();
