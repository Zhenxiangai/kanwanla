/**
 * Shared video-platform helpers.
 *
 * YouTube keeps its historical raw video ID as the storage key so existing
 * digests and notes continue to work. Bilibili uses namespaced keys so its
 * source IDs cannot collide with a YouTube ID.
 */
var YTD_PLATFORMS = (() => {
  const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
  const BILIBILI_ID_PATTERN = /^BV[0-9A-Za-z]{10}$/;

  function normalizePage(page) {
    const value = Number(page);
    return Number.isInteger(value) && value > 0 ? value : 1;
  }

  function parseYouTubeId(url) {
    try {
      const parsed = new URL(String(url || ""));
      let candidate = "";
      if (parsed.hostname === "youtu.be") {
        candidate = parsed.pathname.split("/").filter(Boolean)[0] || "";
      } else if (
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com" ||
        parsed.hostname === "m.youtube.com"
      ) {
        if (parsed.pathname === "/watch") {
          candidate = parsed.searchParams.get("v") || "";
        } else if (parsed.pathname.startsWith("/embed/")) {
          candidate = parsed.pathname.split("/")[2] || "";
        } else if (parsed.pathname.startsWith("/shorts/")) {
          candidate = parsed.pathname.split("/")[2] || "";
        }
      }
      return YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
    } catch {
      return null;
    }
  }

  function parseBvid(input) {
    const match = String(input || "").match(/BV[0-9A-Za-z]{10}/);
    return match ? match[0] : null;
  }

  function parseBilibiliPage(input) {
    try {
      const parsed = new URL(String(input || ""));
      return normalizePage(parsed.searchParams.get("p"));
    } catch {
      const match = String(input || "").match(/[?&]p=(\d+)/);
      return normalizePage(match ? match[1] : 1);
    }
  }

  function parseVideoRef(url) {
    const youtubeId = parseYouTubeId(url);
    if (youtubeId) {
      return {
        platform: "youtube",
        sourceVideoId: youtubeId,
        page: 1,
        storageId: youtubeId,
      };
    }

    try {
      const parsed = new URL(String(url || ""));
      const isBilibili =
        parsed.hostname === "www.bilibili.com" ||
        parsed.hostname === "bilibili.com";
      const isVideoRoute =
        parsed.pathname.startsWith("/video/") ||
        parsed.pathname.startsWith("/list/");
      if (isBilibili && isVideoRoute) {
        const bvid = parseBvid(url);
        if (!bvid) return null;
        const page = parseBilibiliPage(url);
        return {
          platform: "bilibili",
          sourceVideoId: bvid,
          page,
          storageId: `bilibili:${bvid}:p${page}`,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  function isSupportedSiteUrl(url) {
    try {
      const parsed = new URL(String(url || ""));
      if (
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com" ||
        parsed.hostname === "m.youtube.com"
      ) {
        return true;
      }
      return parseVideoRef(url)?.platform === "bilibili";
    } catch {
      return false;
    }
  }

  function canonicalVideoUrl(videoRef, seconds = 0) {
    if (!videoRef || typeof videoRef !== "object") {
      throw new Error("Invalid video reference");
    }
    const start = Math.max(0, Math.floor(Number(seconds) || 0));
    if (videoRef.platform === "youtube") {
      const id = String(videoRef.sourceVideoId || "");
      if (!YOUTUBE_ID_PATTERN.test(id)) throw new Error("Invalid YouTube video ID");
      const url = new URL("https://www.youtube.com/watch");
      url.searchParams.set("v", id);
      if (start > 0) url.searchParams.set("t", `${start}s`);
      return url.toString();
    }
    if (videoRef.platform === "bilibili") {
      const bvid = String(videoRef.sourceVideoId || "");
      if (!BILIBILI_ID_PATTERN.test(bvid)) throw new Error("B 站 BV 号无效。");
      const url = new URL(`https://www.bilibili.com/video/${bvid}`);
      const page = normalizePage(videoRef.page);
      if (page > 1) url.searchParams.set("p", String(page));
      if (start > 0) url.searchParams.set("t", String(start));
      return url.toString();
    }
    throw new Error("Unsupported video platform");
  }

  return {
    YOUTUBE_ID_PATTERN,
    BILIBILI_ID_PATTERN,
    normalizePage,
    parseYouTubeId,
    parseBvid,
    parseBilibiliPage,
    parseVideoRef,
    isSupportedSiteUrl,
    canonicalVideoUrl,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_PLATFORMS;
}
