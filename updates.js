/**
 * Shared update metadata helpers for 看完了.
 *
 * This module knows how to compare extension versions and reduce an untrusted
 * GitHub Release response to a small plain-text record. Browser lifecycle,
 * storage, badges, and tabs stay in background.js.
 */
var KANWANLE_UPDATES = (() => {
  const REPOSITORY = "Zhenxiangai/kanwanle";
  const RELEASE_API_URL =
    "https://api.github.com/repos/Zhenxiangai/kanwanle/releases/latest";
  const RELEASES_URL = "https://github.com/Zhenxiangai/kanwanle/releases/latest";
  const STORAGE_KEY = "kanwanle_update_state";
  const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const FAILED_CHECK_INTERVAL_MS = 60 * 60 * 1000;
  const APPLY_REQUEST_TTL_MS = 10 * 60 * 1000;
  const CHECK_TIMEOUT_MS = 15 * 1000;
  const MAX_RESPONSE_BYTES = 256 * 1024;
  const MAX_RELEASE_NOTES = 4;
  const MAX_NOTE_CHARS = 180;

  const CURRENT_RELEASE = Object.freeze({
    version: "2.0.0",
    title: "看完了 2.0.0",
    notes: Object.freeze([
      "项目正式更名为“看完了”，扩展界面与 GitHub 首页改为中文优先。",
      "新增版本提醒、更新说明和一键更新入口；解压安装版会安全打开最新版下载页。",
      "继续默认使用 DeepSeek V4 Flash，同时保留硅基流动模型选择和 B 站快速概览。",
    ]),
  });

  function normalizeVersion(value) {
    const match = String(value || "")
      .trim()
      .match(/^v?(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/i);
    if (!match) return "";
    const parts = match.slice(1).filter((part) => part !== undefined).map(Number);
    if (parts.some((part) => !Number.isSafeInteger(part) || part > 65535)) {
      return "";
    }
    return parts.join(".");
  }

  function compareVersions(left, right) {
    const leftVersion = normalizeVersion(left);
    const rightVersion = normalizeVersion(right);
    if (!leftVersion || !rightVersion) return 0;
    const leftParts = leftVersion.split(".").map(Number);
    const rightParts = rightVersion.split(".").map(Number);
    for (let index = 0; index < 4; index += 1) {
      const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  function isNewerVersion(currentVersion, candidateVersion) {
    const current = normalizeVersion(currentVersion);
    const candidate = normalizeVersion(candidateVersion);
    return !!current && !!candidate && compareVersions(candidate, current) > 0;
  }

  function cleanPlainText(value, maxChars = MAX_NOTE_CHARS) {
    let text = String(value || "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/[`*_~]/g, "")
      .replace(/^\s*[#>]+\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > maxChars) {
      text = `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
    }
    return text;
  }

  function extractReleaseNotes(body, limit = MAX_RELEASE_NOTES) {
    const markdown = String(body || "").slice(0, MAX_RESPONSE_BYTES);
    const bulletNotes = [];
    const fallbackNotes = [];
    let insideFence = false;

    for (const rawLine of markdown.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (/^```/.test(line)) {
        insideFence = !insideFence;
        continue;
      }
      if (!line || insideFence || /^<!--/.test(line)) continue;
      const bullet = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
      if (bullet) {
        const note = cleanPlainText(bullet[1]);
        if (note) bulletNotes.push(note);
      } else if (!/^#{1,6}\s+/.test(line)) {
        const note = cleanPlainText(line);
        if (note) fallbackNotes.push(note);
      }
    }

    return (bulletNotes.length ? bulletNotes : fallbackNotes).slice(
      0,
      Math.max(0, Math.min(MAX_RELEASE_NOTES, Number(limit) || 0)),
    );
  }

  function normalizeReleaseUrl(value, version) {
    try {
      const url = new URL(String(value || ""));
      const expectedPrefix = `/${REPOSITORY}/releases/tag/`;
      const tag = decodeURIComponent(url.pathname.slice(expectedPrefix.length));
      if (
        url.protocol !== "https:" ||
        url.hostname !== "github.com" ||
        url.port ||
        url.username ||
        url.password ||
        !url.pathname.startsWith(expectedPrefix) ||
        normalizeVersion(tag) !== normalizeVersion(version)
      ) {
        return "";
      }
      return url.toString();
    } catch (_error) {
      return "";
    }
  }

  function normalizePublishedAt(value) {
    const time = Date.parse(String(value || ""));
    return Number.isFinite(time) ? new Date(time).toISOString() : "";
  }

  function normalizeRelease(input) {
    if (!input || typeof input !== "object" || input.draft || input.prerelease) {
      return null;
    }
    const version = normalizeVersion(input.tag_name);
    const url = normalizeReleaseUrl(input.html_url, version);
    if (!version || !url) return null;
    return {
      version,
      title:
        cleanPlainText(input.name, 100) || `看完了 ${version}`,
      notes: extractReleaseNotes(input.body),
      url,
      publishedAt: normalizePublishedAt(input.published_at),
    };
  }

  function normalizeStoredRelease(input) {
    if (!input || typeof input !== "object") return null;
    const version = normalizeVersion(input.version);
    const url = normalizeReleaseUrl(input.url, version);
    if (!version || !url) return null;
    return {
      version,
      title: cleanPlainText(input.title, 100) || `看完了 ${version}`,
      notes: Array.isArray(input.notes)
        ? input.notes
            .map((note) => cleanPlainText(note))
            .filter(Boolean)
            .slice(0, MAX_RELEASE_NOTES)
        : [],
      url,
      publishedAt: normalizePublishedAt(input.publishedAt),
    };
  }

  function normalizeState(input = {}) {
    const justUpdated = input.justUpdated;
    const previousVersion = normalizeVersion(justUpdated?.previousVersion);
    const currentVersion = normalizeVersion(justUpdated?.currentVersion);
    return {
      lastCheckedAt: Number.isFinite(Number(input.lastCheckedAt))
        ? Number(input.lastCheckedAt)
        : 0,
      lastCheckFailed: input.lastCheckFailed === true,
      latestRelease: normalizeStoredRelease(input.latestRelease),
      dismissedVersion: normalizeVersion(input.dismissedVersion),
      pendingStoreVersion: normalizeVersion(input.pendingStoreVersion),
      applyRequestedAt: Number.isFinite(Number(input.applyRequestedAt))
        ? Number(input.applyRequestedAt)
        : 0,
      justUpdated:
        previousVersion && currentVersion && previousVersion !== currentVersion
          ? { previousVersion, currentVersion }
          : null,
    };
  }

  function buildStatus(currentVersion, inputState = {}) {
    const current = normalizeVersion(currentVersion) || CURRENT_RELEASE.version;
    const state = normalizeState(inputState);
    const release = state.latestRelease;
    const updateAvailable = !!release && isNewerVersion(current, release.version);
    const justUpdated = state.justUpdated?.currentVersion === current;
    const showAvailable =
      updateAvailable && state.dismissedVersion !== release.version;
    const notes = updateAvailable
      ? release.notes
      : justUpdated
        ? [...CURRENT_RELEASE.notes]
        : [];

    return {
      currentVersion: current,
      latestVersion: updateAvailable ? release.version : current,
      title: updateAvailable
        ? release.title
        : justUpdated
          ? CURRENT_RELEASE.title
          : "",
      notes,
      releaseUrl: updateAvailable ? release.url : RELEASES_URL,
      updateAvailable,
      showUpdate: showAvailable || justUpdated,
      justUpdated,
      pendingStoreVersion: state.pendingStoreVersion,
      checkedAt: state.lastCheckedAt,
    };
  }

  function byteLength(value) {
    const text = String(value || "");
    if (typeof TextEncoder === "function") {
      return new TextEncoder().encode(text).byteLength;
    }
    return unescape(encodeURIComponent(text)).length;
  }

  async function readBoundedResponseText(response) {
    const reader = response.body?.getReader?.();
    if (!reader) {
      const text = await response.text();
      if (byteLength(text) > MAX_RESPONSE_BYTES) {
        throw new Error("GitHub 更新响应过大。");
      }
      return text;
    }

    const decoder = new TextDecoder();
    let receivedBytes = 0;
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value?.byteLength || 0;
      if (receivedBytes > MAX_RESPONSE_BYTES) {
        await Promise.resolve(reader.cancel()).catch(() => {});
        throw new Error("GitHub 更新响应过大。");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  }

  async function readReleaseResponse(response) {
    if (!response?.ok) {
      throw new Error(`GitHub 更新检查失败（${response?.status || "网络错误"}）。`);
    }
    const declaredLength = Number(response.headers?.get?.("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new Error("GitHub 更新响应过大。");
    }
    const text = await readBoundedResponseText(response);
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      throw new Error("GitHub 更新响应格式无效。");
    }
    const release = normalizeRelease(payload);
    if (!release) throw new Error("GitHub 更新信息无效。");
    return release;
  }

  /**
   * Creates the browser-facing update service. Callers see five small actions;
   * storage layout, GitHub validation, badge state, and store fallback remain
   * hidden inside the module.
   */
  function createManager({
    chromeApi,
    fetchImpl,
    now = () => Date.now(),
    schedule = (callback, delay) => setTimeout(callback, delay),
  }) {
    if (!chromeApi?.runtime || !chromeApi?.storage?.local) {
      throw new Error("更新服务缺少浏览器运行环境。");
    }
    const runtime = chromeApi.runtime;
    const storage = chromeApi.storage.local;
    const request = fetchImpl || globalThis.fetch?.bind(globalThis);

    function currentVersion() {
      return normalizeVersion(runtime.getManifest?.().version) || CURRENT_RELEASE.version;
    }

    async function readState() {
      const stored = await storage.get(STORAGE_KEY);
      return normalizeState(stored?.[STORAGE_KEY]);
    }

    async function writeState(state) {
      const normalized = normalizeState(state);
      await storage.set({ [STORAGE_KEY]: normalized });
      return normalized;
    }

    async function updateBadge(status) {
      if (typeof chromeApi.action?.setBadgeText !== "function") return;
      const text = status.updateAvailable && status.showUpdate ? "新" : "";
      await Promise.resolve(chromeApi.action.setBadgeText({ text })).catch(
        () => {},
      );
      if (text && typeof chromeApi.action.setBadgeBackgroundColor === "function") {
        await Promise.resolve(
          chromeApi.action.setBadgeBackgroundColor({ color: "#c8674f" }),
        ).catch(() => {});
      }
    }

    async function statusFromState(state, extra = {}) {
      const status = { ...buildStatus(currentVersion(), state), ...extra };
      await updateBadge(status);
      return status;
    }

    async function refresh({ force = false } = {}) {
      let state = await readState();
      const age = Math.max(0, now() - state.lastCheckedAt);
      const interval = state.lastCheckFailed
        ? FAILED_CHECK_INTERVAL_MS
        : CHECK_INTERVAL_MS;
      if (!force && state.lastCheckedAt > 0 && age < interval) {
        return statusFromState(state);
      }
      if (typeof request !== "function") {
        return statusFromState(state, { checkError: "当前浏览器无法检查更新。" });
      }

      try {
        const signal =
          typeof AbortSignal !== "undefined" &&
          typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(CHECK_TIMEOUT_MS)
            : undefined;
        const response = await request(RELEASE_API_URL, {
          method: "GET",
          credentials: "omit",
          cache: "no-store",
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          ...(signal ? { signal } : {}),
        });
        const latestRelease = await readReleaseResponse(response);
        state = await writeState({
          ...state,
          latestRelease,
          lastCheckedAt: now(),
          lastCheckFailed: false,
        });
        return statusFromState(state);
      } catch (_error) {
        state = await writeState({
          ...state,
          lastCheckedAt: now(),
          lastCheckFailed: true,
        });
        return statusFromState(state, {
          checkError: "暂时无法检查更新，请稍后再试。",
        });
      }
    }

    async function getStatus({ refreshIfDue = true } = {}) {
      if (refreshIfDue) return refresh();
      return statusFromState(await readState());
    }

    async function checkNow() {
      return refresh({ force: true });
    }

    async function dismiss(version) {
      const state = await readState();
      const status = buildStatus(currentVersion(), state);
      const dismissedVersion = normalizeVersion(version);
      if (
        !status.updateAvailable ||
        !dismissedVersion ||
        dismissedVersion !== status.latestVersion
      ) {
        return statusFromState(state);
      }
      return statusFromState(
        await writeState({ ...state, dismissedVersion }),
      );
    }

    async function acknowledge() {
      const state = await readState();
      return statusFromState(await writeState({ ...state, justUpdated: null }));
    }

    async function openManualRelease(state, status) {
      const cleared = await writeState({ ...state, applyRequestedAt: 0 });
      const url = status.releaseUrl || RELEASES_URL;
      if (typeof chromeApi.tabs?.create === "function") {
        await chromeApi.tabs.create({ url });
        await updateBadge(buildStatus(currentVersion(), cleared));
        return { success: true, mode: "manual", opened: true, url };
      }
      return { success: true, mode: "manual", opened: false, url };
    }

    async function install() {
      let state = await readState();
      const status = buildStatus(currentVersion(), state);
      if (!status.updateAvailable) {
        return { success: false, mode: "none", error: "当前已经是最新版。" };
      }

      if (isNewerVersion(currentVersion(), state.pendingStoreVersion)) {
        schedule(() => runtime.reload(), 150);
        return { success: true, mode: "store", reloading: true };
      }

      if (typeof runtime.requestUpdateCheck !== "function") {
        return openManualRelease(state, status);
      }

      state = await writeState({ ...state, applyRequestedAt: now() });
      try {
        const result = await runtime.requestUpdateCheck();
        if (result?.status === "update_available") {
          state = await readState();
          if (isNewerVersion(currentVersion(), state.pendingStoreVersion)) {
            schedule(() => runtime.reload(), 150);
            return { success: true, mode: "store", reloading: true };
          }
          return {
            success: true,
            mode: "store",
            waiting: true,
            version: normalizeVersion(result.version),
          };
        }
      } catch (_error) {
        // Unpacked installs and temporarily unavailable stores use the same
        // validated manual-release fallback below.
      }
      return openManualRelease(state, status);
    }

    async function recordInstalled(details = {}) {
      let state = await readState();
      if (details.reason === "update") {
        state = await writeState({
          ...state,
          pendingStoreVersion: "",
          applyRequestedAt: 0,
          justUpdated: {
            previousVersion: details.previousVersion,
            currentVersion: currentVersion(),
          },
        });
      }
      return statusFromState(state);
    }

    async function recordUpdateAvailable(details = {}) {
      let state = await readState();
      state = await writeState({
        ...state,
        pendingStoreVersion: details.version,
      });
      const requestedRecently =
        state.applyRequestedAt > 0 &&
        Math.max(0, now() - state.applyRequestedAt) <= APPLY_REQUEST_TTL_MS;
      if (requestedRecently) schedule(() => runtime.reload(), 150);
      return statusFromState(state);
    }

    function bindLifecycle({ onFirstInstall } = {}) {
      runtime.onInstalled?.addListener?.((details) => {
        if (details.reason === "install") onFirstInstall?.();
        void recordInstalled(details).then(() => refresh()).catch(() => {});
      });
      runtime.onStartup?.addListener?.(() => {
        void refresh().catch(() => {});
      });
      runtime.onUpdateAvailable?.addListener?.((details) => {
        void recordUpdateAvailable(details).catch(() => {});
      });
    }

    return {
      bindLifecycle,
      getStatus,
      checkNow,
      dismiss,
      acknowledge,
      install,
      recordInstalled,
      recordUpdateAvailable,
    };
  }

  return {
    REPOSITORY,
    RELEASE_API_URL,
    RELEASES_URL,
    STORAGE_KEY,
    CHECK_INTERVAL_MS,
    FAILED_CHECK_INTERVAL_MS,
    APPLY_REQUEST_TTL_MS,
    CHECK_TIMEOUT_MS,
    MAX_RESPONSE_BYTES,
    MAX_RELEASE_NOTES,
    MAX_NOTE_CHARS,
    CURRENT_RELEASE,
    normalizeVersion,
    compareVersions,
    isNewerVersion,
    cleanPlainText,
    extractReleaseNotes,
    normalizeRelease,
    normalizeStoredRelease,
    normalizeState,
    buildStatus,
    readBoundedResponseText,
    readReleaseResponse,
    createManager,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = KANWANLE_UPDATES;
}
