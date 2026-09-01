/**
 * Shared transcript normalization helpers.
 *
 * This module is intentionally dependency-free so the service worker, content
 * scripts, and Node tests all use the same timestamp and WebVTT rules.
 */
var YTD_TRANSCRIPTS = (() => {
  function parseTimestamp(value) {
    const parts = String(value || "")
      .trim()
      .replace(",", ".")
      .split(":");
    if (parts.length < 2 || parts.length > 3) return null;
    const seconds = Number(parts.pop());
    const minutes = Number(parts.pop());
    const hours = parts.length ? Number(parts.pop()) : 0;
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      hours < 0 ||
      minutes < 0 ||
      minutes >= 60 ||
      seconds < 0 ||
      seconds >= 60
    ) {
      return null;
    }
    return hours * 3600 + minutes * 60 + seconds;
  }

  function decodeEntities(value) {
    const entities = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      nbsp: " ",
      lrm: "",
      rlm: "",
    };
    return String(value || "").replace(
      /&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi,
      (match, entity) => {
        if (entity[0] === "#") {
          const hex = entity[1]?.toLowerCase() === "x";
          const codePoint = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
          if (Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff) {
            try {
              return String.fromCodePoint(codePoint);
            } catch {
              return match;
            }
          }
          return match;
        }
        return Object.prototype.hasOwnProperty.call(entities, entity.toLowerCase())
          ? entities[entity.toLowerCase()]
          : match;
      },
    );
  }

  function cleanCueText(value) {
    return decodeEntities(
      String(value || "")
        .replace(/<br\s*\/?\s*>/gi, " ")
        .replace(/<[^>]*>/g, " "),
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseVtt(input) {
    const lines = String(input || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
    const entries = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line.includes("-->")) continue;
      const timing = line.match(
        /^([^\s]+)\s+-->\s+([^\s]+)(?:\s+.*)?$/,
      );
      if (!timing) continue;
      const start = parseTimestamp(timing[1]);
      const end = parseTimestamp(timing[2]);
      if (start === null || end === null || end < start) continue;

      const textLines = [];
      for (index += 1; index < lines.length && lines[index].trim(); index += 1) {
        textLines.push(lines[index]);
      }
      const text = cleanCueText(textLines.join(" "));
      if (!text) continue;
      entries.push({
        text,
        start,
        duration: Math.max(0, end - start),
      });
    }
    return entries;
  }

  function formatTimestamp(secondsValue) {
    const wholeSeconds = Math.max(0, Math.floor(Number(secondsValue) || 0));
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds % 3600) / 60);
    const seconds = wholeSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function normalizeEntries(entries, language = null) {
    return (Array.isArray(entries) ? entries : [])
      .map((entry) => ({
        text: cleanCueText(entry?.text),
        start: Math.max(0, Number(entry?.start) || 0),
        duration: Math.max(0, Number(entry?.duration) || 0),
        language: entry?.language || language || null,
      }))
      .filter((entry) => entry.text)
      .sort((left, right) => left.start - right.start);
  }

  function buildResult(entries, options = {}) {
    const normalized = normalizeEntries(entries, options.language);
    return {
      success: normalized.length > 0,
      transcript: normalized,
      transcriptText: normalized.map((entry) => entry.text).join(" "),
      transcriptTextTimestamped: normalized
        .map((entry) => `[${formatTimestamp(entry.start)}] ${entry.text}`)
        .join("\n"),
      language: options.language || normalized[0]?.language || null,
      languageLabel: options.languageLabel || options.language || null,
      source: options.source || null,
      videoInfo: options.videoInfo || undefined,
    };
  }

  return {
    parseTimestamp,
    cleanCueText,
    parseVtt,
    formatTimestamp,
    normalizeEntries,
    buildResult,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_TRANSCRIPTS;
}
