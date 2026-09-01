(function attachNotesModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KANWANLA_NOTES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createNotesApi() {
  "use strict";

  const DEFAULT_MAX_EXCERPT_CHARS = 600;
  const DEFAULT_FEEDBACK_DURATION_MS = 8000;
  const TERMINAL_PUNCTUATION = /[。！？!?…][”’"']?$/;

  function cleanText(value, maxLength = 3000) {
    return typeof value === "string"
      ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
      : "";
  }

  function normalizeTranscript(transcript) {
    if (!Array.isArray(transcript)) return [];
    return transcript
      .map((entry) => ({
        start: Math.max(0, Number(entry?.start) || 0),
        text: cleanText(entry?.text, DEFAULT_MAX_EXCERPT_CHARS),
      }))
      .filter((entry) => entry.text)
      .sort((left, right) => left.start - right.start);
  }

  /**
   * Build a useful current-moment note entirely from local caption cues.
   * Saving a note must never wait for (or spend tokens on) an AI provider.
   */
  function buildTimedExcerpt(transcript, timestamp, options = {}) {
    const entries = normalizeTranscript(transcript);
    if (!entries.length) return null;

    const safeTimestamp = Math.max(0, Number(timestamp) || 0);
    const maxChars = Math.max(
      80,
      Math.min(
        DEFAULT_MAX_EXCERPT_CHARS,
        Number(options.maxChars) || DEFAULT_MAX_EXCERPT_CHARS,
      ),
    );
    let targetIndex = 0;
    for (let index = 0; index < entries.length; index += 1) {
      if (entries[index].start <= safeTimestamp) targetIndex = index;
      else break;
    }

    const target = entries[targetIndex];
    const parts = [target.text];
    // Caption providers often split one sentence into several tiny cues. Add
    // only enough following cues to reach a natural sentence boundary.
    for (
      let index = targetIndex + 1;
      index < entries.length && index <= targetIndex + 3;
      index += 1
    ) {
      const candidate = cleanText(`${parts.join(" ")} ${entries[index].text}`, maxChars);
      if (candidate.length >= maxChars) break;
      parts.push(entries[index].text);
      if (TERMINAL_PUNCTUATION.test(entries[index].text)) break;
    }

    return {
      text: cleanText(parts.join(" "), maxChars),
      rawText: target.text,
      cueStart: target.start,
    };
  }

  function errorMessage(error, fallbackMessage) {
    if (cleanText(fallbackMessage, 500)) return cleanText(fallbackMessage, 500);
    const code = cleanText(error, 100);
    if (["NO_TRANSCRIPT", "EMPTY_TRANSCRIPT"].includes(code)) {
      return "此视频没有可用字幕，暂时无法记录当前时间。你仍可在字幕中划线后保存。";
    }
    if (code === "BILIBILI_LOGIN_REQUIRED") {
      return "此字幕需要登录 B 站后才能读取，请确认登录状态再重试。";
    }
    return "笔记没有保存成功，请稍后重试。";
  }

  function normalizeSaveResult(result) {
    if (
      result?.success === true &&
      result.note &&
      cleanText(result.note.text)
    ) {
      return { ...result, success: true, note: result.note };
    }
    const error = cleanText(result?.error, 100) || "SAVE_FAILED";
    return {
      success: false,
      error,
      message: errorMessage(error, result?.message),
    };
  }

  function createCaptureController({ save, onStateChange = () => {} }) {
    if (typeof save !== "function") {
      throw new TypeError("createCaptureController requires a save function");
    }
    let inFlight = null;

    function capture(payload) {
      if (inFlight) return inFlight;
      onStateChange({ status: "saving" });

      let pending;
      try {
        pending = Promise.resolve(save(payload));
      } catch (error) {
        pending = Promise.reject(error);
      }

      let task;
      task = pending
        .then((result) => normalizeSaveResult(result))
        .catch((error) =>
          normalizeSaveResult({
            success: false,
            error: error?.code || "SAVE_FAILED",
            message: error?.message,
          }),
        )
        .then((result) => {
          if (result.success) {
            onStateChange({ status: "saved", note: result.note });
          } else {
            onStateChange({
              status: "error",
              error: result.error,
              message: result.message,
            });
          }
          return result;
        })
        .finally(() => {
          if (inFlight === task) inFlight = null;
        });
      inFlight = task;
      return task;
    }

    return {
      capture,
      get pending() {
        return Boolean(inFlight);
      },
    };
  }

  function feedbackText(language, key) {
    const shared = globalThis.KANWANLA_I18N;
    if (shared?.translate) return shared.translate(language || "zh-CN", key);
    const fallback = {
      noteSaved: "笔记已保存",
      noteNotSaved: "笔记未保存",
      currentTime: "当前时间",
      currentVideoTitle: "当前视频",
      close: "关闭",
      closeNoteFeedback: "关闭笔记提示",
      copyTimeLink: "复制时间链接",
      copied: "已复制",
      copyFailed: "复制失败",
      viewAllNotes: "查看全部笔记",
    };
    return fallback[key] || key;
  }

  function createFeedbackModel(result, language = "zh-CN") {
    const normalized = normalizeSaveResult(result);
    if (!normalized.success) {
      return {
        kind: "error",
        title: feedbackText(language, "noteNotSaved"),
        meta: "",
        text: normalized.message,
        timestampedUrl: "",
        actions: { copyLink: false, openNotes: false },
      };
    }

    const note = normalized.note;
    const timestamp =
      cleanText(note.timestamp, 40) || feedbackText(language, "currentTime");
    const title =
      cleanText(note.videoTitle, 300) ||
      feedbackText(language, "currentVideoTitle");
    const timestampedUrl = cleanText(note.timestampedUrl, 2000);
    return {
      kind: "success",
      title: feedbackText(language, "noteSaved"),
      meta: `${timestamp} — ${title}`,
      text: cleanText(note.text),
      timestampedUrl,
      actions: { copyLink: Boolean(timestampedUrl), openNotes: true },
    };
  }

  function appendTextElement(documentLike, parent, tag, text, style) {
    const element = documentLike.createElement(tag);
    element.textContent = text;
    if (style) element.style.cssText = style;
    parent.appendChild(element);
    return element;
  }

  function renderFeedback(documentLike, result, options = {}) {
    if (!documentLike?.createElement || !documentLike?.body) return null;
    const model = createFeedbackModel(result, options.language);
    const cardId = options.id || "kanwanla-note-feedback";
    documentLike.getElementById?.(cardId)?.remove?.();

    const card = documentLike.createElement("section");
    card.id = cardId;
    card.setAttribute("role", model.kind === "error" ? "alert" : "status");
    card.setAttribute("aria-live", model.kind === "error" ? "assertive" : "polite");
    card.style.cssText = `position:fixed;right:20px;bottom:20px;z-index:2147483647;
      width:min(360px,calc(100vw - 32px));box-sizing:border-box;padding:16px 18px;
      color:#2e2a24;background:#fff;border:1px solid ${
        model.kind === "error" ? "#e6a090" : "#e8dfd2"
      };border-radius:14px;box-shadow:0 14px 38px rgba(32,26,20,.24);
      font:13px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;`;

    const header = documentLike.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;";
    appendTextElement(
      documentLike,
      header,
      "strong",
      model.title,
      `font-size:14px;color:${model.kind === "error" ? "#b84732" : "#c55f48"};`,
    );
    const close = appendTextElement(
      documentLike,
      header,
      "button",
      feedbackText(options.language, "close"),
    );
    close.type = "button";
    close.setAttribute(
      "aria-label",
      feedbackText(options.language, "closeNoteFeedback"),
    );
    close.style.cssText = "border:0;background:transparent;color:#766e64;cursor:pointer;padding:3px 5px;";
    close.addEventListener("click", () => card.remove());
    card.appendChild(header);

    if (model.meta) {
      appendTextElement(
        documentLike,
        card,
        "div",
        model.meta,
        "font-size:12px;color:#746b61;margin-bottom:8px;",
      );
    }
    appendTextElement(
      documentLike,
      card,
      "div",
      model.text,
      "white-space:pre-wrap;overflow-wrap:anywhere;color:#2e2a24;",
    );

    if (model.actions.copyLink || (model.actions.openNotes && options.onOpenNotes)) {
      const actions = documentLike.createElement("div");
      actions.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;margin-top:11px;";
      const actionStyle = "border:0;background:transparent;color:#c55f48;font-weight:650;cursor:pointer;padding:2px 0;";
      if (model.actions.copyLink) {
        const copyButton = appendTextElement(
          documentLike,
          actions,
          "button",
          feedbackText(options.language, "copyTimeLink"),
          actionStyle,
        );
        copyButton.type = "button";
        copyButton.addEventListener("click", async () => {
          try {
            const writeText =
              options.copyText ||
              ((text) => globalThis.navigator?.clipboard?.writeText(text));
            await writeText(model.timestampedUrl);
            copyButton.textContent = feedbackText(options.language, "copied");
          } catch (_error) {
            copyButton.textContent = feedbackText(options.language, "copyFailed");
          }
        });
      }
      if (model.actions.openNotes && typeof options.onOpenNotes === "function") {
        const openButton = appendTextElement(
          documentLike,
          actions,
          "button",
          feedbackText(options.language, "viewAllNotes"),
          actionStyle,
        );
        openButton.type = "button";
        openButton.addEventListener("click", () => options.onOpenNotes());
      }
      card.appendChild(actions);
    }

    documentLike.body.appendChild(card);
    const duration = Number.isFinite(options.durationMs)
      ? Math.max(0, options.durationMs)
      : DEFAULT_FEEDBACK_DURATION_MS;
    if (duration > 0) {
      const schedule = options.setTimeoutImpl || globalThis.setTimeout;
      schedule?.(() => card.remove?.(), duration);
    }
    return card;
  }

  return {
    buildTimedExcerpt,
    createCaptureController,
    createFeedbackModel,
    normalizeSaveResult,
    renderFeedback,
  };
});
