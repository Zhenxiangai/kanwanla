/**
 * Bilibili video and subtitle API adapter.
 * Adapted from https://github.com/biuworks/bilibili-digest (MIT).
 * Copyright (c) 2026 k1234567.
 */
var BILI_API = (() => {
  const wbiModule =
    typeof BILI_WBI !== "undefined"
      ? BILI_WBI
      : typeof require === "function"
        ? require("./wbi.js")
        : null;

  const VIEW_URL = "https://api.bilibili.com/x/web-interface/view";
  const PLAYER_URL = "https://api.bilibili.com/x/player/wbi/v2";
  const DEFAULT_LANG_PREFERENCE = Object.freeze([
    "zh-CN",
    "zh-Hans",
    "zh-Hant",
    "zh",
    "ai-zh",
    "en-US",
    "en",
    "ai-en",
  ]);

  class BiliApiError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "BiliApiError";
      this.code = code;
    }
  }

  function parseBvid(input) {
    const match = String(input || "").match(/BV[0-9A-Za-z]{10}/);
    return match ? match[0] : null;
  }

  function parsePageNumber(input) {
    const match = String(input || "").match(/[?&]p=(\d+)/);
    const page = match ? Number(match[1]) : 1;
    return Number.isInteger(page) && page > 0 ? page : 1;
  }

  function canonicalVideoUrl(bvid, seconds = 0, page = 1) {
    if (!/^BV[0-9A-Za-z]{10}$/.test(String(bvid || ""))) {
      throw new Error("B 站 BV 号无效。");
    }
    const url = new URL(`https://www.bilibili.com/video/${bvid}`);
    if (page > 1) url.searchParams.set("p", String(page));
    const start = Math.max(0, Math.floor(Number(seconds) || 0));
    if (start > 0) url.searchParams.set("t", String(start));
    return url.toString();
  }

  async function readEnvelope(response, label) {
    if (!response.ok) {
      throw new BiliApiError(
        "HTTP_ERROR",
        `${label} 请求失败：HTTP ${response.status}`,
      );
    }
    const payload = await response.json();
    if (payload?.code !== 0) {
      const code = payload?.code;
      if (code === -404 || code === 62002 || code === 62004) {
        throw new BiliApiError("VIDEO_UNAVAILABLE", "此 B 站视频不可用。");
      }
      if (code === -403) {
        throw new BiliApiError("FORBIDDEN", "B 站不允许访问此字幕。");
      }
      if (code === -352) {
        throw new BiliApiError(
          "RISK_CONTROL",
          "B 站拦截了此请求。请正常打开视频，稍等片刻后重试。",
        );
      }
      throw new BiliApiError(
        "API_ERROR",
        payload?.message || `${label} 返回错误代码 ${code}`,
      );
    }
    return payload.data;
  }

  function normalizeVideoInfo(data, page = 1) {
    const pages = Array.isArray(data?.pages) ? data.pages : [];
    const target = pages.find((item) => Number(item?.page) === page) || pages[0];
    return {
      bvid: data?.bvid || "",
      aid: Number(data?.aid) || 0,
      cid: Number(target?.cid ?? data?.cid) || 0,
      page,
      title: (pages.length > 1 && target?.part) || data?.title || "",
      description: data?.desc || "",
      owner: data?.owner?.name || "",
      duration: Number(target?.duration ?? data?.duration) || 0,
      pageCount: pages.length || 1,
    };
  }

  async function fetchVideoInfo(bvid, { fetchImpl = fetch, page = 1 } = {}) {
    const url = new URL(VIEW_URL);
    url.searchParams.set("bvid", bvid);
    const response = await fetchImpl(url.toString(), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await readEnvelope(response, "B 站视频信息");
    const info = normalizeVideoInfo(data, page);
    if (!info.cid) throw new BiliApiError("NO_CID", "B 站没有返回 cid。");
    return info;
  }

  function normalizeSubtitleTracks(playerData) {
    const raw = playerData?.subtitle?.subtitles;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((track) => {
        const url = String(track?.subtitle_url || "");
        if (!url) return null;
        return {
          id: String(track?.id ?? ""),
          lang: String(track?.lan || ""),
          langLabel: String(track?.lan_doc || track?.lan || ""),
          url: url.startsWith("//") ? `https:${url}` : url,
          isAi:
            Number(track?.ai_status) > 0 ||
            Number(track?.ai_type) > 0 ||
            String(track?.lan || "").startsWith("ai-"),
        };
      })
      .filter(Boolean);
  }

  function subtitleNeedsLogin(playerData) {
    return !!playerData?.need_login_subtitle;
  }

  function pickSubtitleTrack(tracks, preference = DEFAULT_LANG_PREFERENCE) {
    if (!Array.isArray(tracks) || tracks.length === 0) return null;
    const rank = (track) => {
      const index = preference.indexOf(track.lang);
      return index === -1 ? preference.length : index;
    };
    return [...tracks].sort((a, b) => {
      const byLanguage = rank(a) - rank(b);
      return byLanguage !== 0 ? byLanguage : Number(a.isAi) - Number(b.isAi);
    })[0];
  }

  async function fetchSubtitleTracks(
    { aid, cid, bvid },
    { fetchImpl = fetch, wbi = wbiModule } = {},
  ) {
    if (!wbi) throw new Error("B 站 WBI 签名组件不可用。");
    const keys = await wbi.fetchWbiKeys({ fetchImpl });
    const url = wbi.signedUrl(PLAYER_URL, { aid, cid, bvid }, keys);
    const response = await fetchImpl(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await readEnvelope(response, "B 站字幕列表");
    return {
      tracks: normalizeSubtitleTracks(data),
      needLogin: subtitleNeedsLogin(data),
    };
  }

  function splitLongChineseRun(value, maxChars = 32, idealChars = 24) {
    const parts = [];
    let rest = value;
    while (rest.length > maxChars) {
      const windowText = rest.slice(0, maxChars + 1);
      const lowerBound = Math.floor(idealChars * 0.65);
      let cut = -1;
      const naturalBoundary =
        /(?:的话|时候|之后|以前|以后|起来|下来|方面|里面|当中|原因|结果|问题|选择|关系|内容|工作|事情|能力|情况)/g;
      let match;
      while ((match = naturalBoundary.exec(windowText))) {
        const candidate = match.index + match[0].length;
        if (candidate >= lowerBound) cut = candidate;
      }
      if (cut <= 0) cut = idealChars;
      parts.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) parts.push(rest);
    return parts.join("，");
  }

  /**
   * Bilibili AI captions are often returned as long Chinese runs with no
   * punctuation. Add conservative local clause boundaries without sending
   * subtitle text to another service. Existing punctuation is preserved.
   */
  function formatSubtitleCueText(value, duration = 0) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (!normalized || !/[\u3400-\u9fff]/.test(normalized)) return normalized;

    const withConnectors = normalized.replace(
      /([^，。！？；：,.!?;:…]{8,}?)(?=(?:但是|不过|所以|然后|因为|如果|而且|另外|其实|当然|同时|甚至|比如|例如|于是|那么|以及|并且|或者|只是|就是))/g,
      "$1，",
    );
    const formatted = withConnectors
      .split(/([，。！？；：,.!?;:…]+)/)
      .map((part) =>
        /[\u3400-\u9fff]/.test(part) &&
        !/^[，。！？；：,.!?;:…]+$/.test(part)
          ? splitLongChineseRun(part)
          : part,
      )
      .join("");

    if (/[，。！？；：,.!?;:…][\"'”’）】」』]*$/.test(formatted)) {
      return formatted;
    }
    const cjkLength = (formatted.match(/[\u3400-\u9fff]/g) || []).length;
    return `${formatted}${duration >= 4 || cjkLength >= 18 ? "。" : "，"}`;
  }

  function normalizeSubtitleBody(payload) {
    const body = Array.isArray(payload?.body) ? payload.body : [];
    return body
      .map((line) => {
        const start = Number(line?.from) || 0;
        const end = Number(line?.to) || start;
        const duration = Math.max(0, end - start);
        const text = formatSubtitleCueText(line?.content, duration);
        if (!text) return null;
        return {
          text,
          start: Math.max(0, start),
          duration,
        };
      })
      .filter(Boolean);
  }

  async function fetchSubtitleTrackContent(trackUrl, { fetchImpl = fetch } = {}) {
    const response = await fetchImpl(trackUrl, {
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new BiliApiError(
        "SUBTITLE_DOWNLOAD_FAILED",
        `B 站字幕下载失败：HTTP ${response.status}`,
      );
    }
    return normalizeSubtitleBody(await response.json());
  }

  return {
    VIEW_URL,
    PLAYER_URL,
    DEFAULT_LANG_PREFERENCE,
    BiliApiError,
    parseBvid,
    parsePageNumber,
    canonicalVideoUrl,
    normalizeVideoInfo,
    normalizeSubtitleTracks,
    formatSubtitleCueText,
    normalizeSubtitleBody,
    subtitleNeedsLogin,
    pickSubtitleTrack,
    fetchVideoInfo,
    fetchSubtitleTracks,
    fetchSubtitleTrackContent,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BILI_API;
}
