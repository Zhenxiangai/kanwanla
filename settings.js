/**
 * Shared, non-secret configuration helpers.
 *
 * API keys are stored in chrome.storage.local by options.js. This file contains
 * defaults and validation only, so it is safe to publish.
 */
var YTD_SETTINGS = (() => {
  const STORAGE_KEY = "ytd_settings";
  const DEFAULTS = Object.freeze({
    provider: "siliconflow",
    aiApiKey: "",
    aiBaseUrl: "https://api.siliconflow.cn/v1",
    aiModel: "",
    supadataApiKey: "",
  });

  function isCurrentProvider(input) {
    return !!input && input.provider === DEFAULTS.provider;
  }

  function isLegacyProvider(input) {
    return (
      !!input &&
      typeof input === "object" &&
      Object.keys(input).length > 0 &&
      !isCurrentProvider(input)
    );
  }

  function normalizeModel(value) {
    if (typeof value !== "string") return "";
    const model = value.trim();
    return /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(model) ? model : "";
  }

  function normalize(input = {}) {
    const keepAiSettings = isCurrentProvider(input);
    return {
      provider: DEFAULTS.provider,
      aiApiKey:
        keepAiSettings && typeof input.aiApiKey === "string"
          ? input.aiApiKey.trim()
          : "",
      aiBaseUrl: DEFAULTS.aiBaseUrl,
      aiModel: keepAiSettings ? normalizeModel(input.aiModel) : "",
      supadataApiKey:
        typeof input.supadataApiKey === "string"
          ? input.supadataApiKey.trim()
          : "",
    };
  }

  function migrateLegacyProvider(input = {}) {
    return {
      settings: normalize(input),
      migrated: isLegacyProvider(input),
    };
  }

  function apiUrl(baseUrl, path) {
    const normalizedBaseUrl =
      typeof baseUrl === "string" && baseUrl.trim()
        ? baseUrl.trim().replace(/\/+$/, "")
        : DEFAULTS.aiBaseUrl;
    return `${normalizedBaseUrl}/${String(path || "").replace(/^\/+/, "")}`;
  }

  function chatCompletionsUrl(baseUrl = DEFAULTS.aiBaseUrl) {
    return apiUrl(baseUrl, "chat/completions");
  }

  function modelsUrl(baseUrl = DEFAULTS.aiBaseUrl) {
    return `${apiUrl(baseUrl, "models")}?type=text&sub_type=chat`;
  }

  function canonicalYouTubeUrl(videoId) {
    const normalized = String(videoId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(normalized)) {
      throw new Error("Invalid YouTube video ID.");
    }
    return `https://www.youtube.com/watch?v=${normalized}`;
  }

  return {
    STORAGE_KEY,
    DEFAULTS,
    isCurrentProvider,
    isLegacyProvider,
    normalizeModel,
    normalize,
    migrateLegacyProvider,
    chatCompletionsUrl,
    modelsUrl,
    canonicalYouTubeUrl,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_SETTINGS;
}
