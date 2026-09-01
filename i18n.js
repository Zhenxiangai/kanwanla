(function attachI18nModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KANWANLA_I18N = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createI18nApi() {
  "use strict";

  const LANGUAGE_STORAGE_KEY = "ytd_options_language";
  const PREFERENCES = new Set(["zh-CN", "en", "auto"]);
  const COPY = {
    en: {
      settings: "Settings",
      checkUpdate: "Check updates",
      checkingUpdate: "Checking…",
      newVersion: ({ version }) => `New v${version}`,
      latestVersion: "Up to date",
      updatedVersion: ({ version }) => `Updated v${version}`,
      openingUpdate: "Opening…",
      updateCheckFailed: "Retry update",
      transcript: "Transcript",
      overview: "Overview",
      notes: "Notes",
      original: "Original",
      chinese: "Chinese",
      bilingual: "Bilingual",
      readyTitle: "Ready to create a digest",
      readyDescription: "Open a YouTube or Bilibili video, then click Digest on the page.",
      fetchingTranscript: "Fetching transcript",
      extractingTranscript: "Extracting captions from the video…",
      errorTitle: "Something went wrong",
      retry: "Retry",
      fullTranscript: "Full transcript",
      copy: "Copy",
      export: "Export",
      searchPlaceholder: "Search words or phrases",
      chapters: "Chapters",
      chaptersPlaceholder: "Chapters will appear here",
      keyQuotes: "Key excerpts",
      quotesPlaceholder: "Open this tab to extract key excerpts…",
      savedNotes: "Saved notes",
      currentVideo: "Current video",
      allNotes: "All notes",
      saveCurrent: "Save current moment",
      noteIntro: "Use the button above, Note on the video, or N to save the current caption.",
      noNotesCurrent: "No notes for this video yet. Use Save current moment or Note on the video.",
      noNotesAny: "No saved notes yet. Open a video and save a moment to begin.",
      followPlayback: "Follow playback",
      digest: "Digest",
      clickExtensionIcon: "Click the extension icon",
      noteCapture: "Take note",
      saving: "Saving…",
      saved: "Saved",
      saveFailed: "Save failed",
      noteSaved: "Note saved",
      noteNotSaved: "Note not saved",
      currentTime: "Current time",
      currentVideoTitle: "Current video",
      close: "Close",
      closeNoteFeedback: "Close note notification",
      copyTimeLink: "Copy timestamp link",
      copied: "Copied",
      copyFailed: "Copy failed",
      viewAllNotes: "View all notes",
      noteGenericError: "The note was not saved. Please try again.",
      noTranscriptForNote: "This video has no usable captions for a timed note. You can still select transcript text and save it.",
      bilibiliLoginForNote: "Sign in to Bilibili to access this caption track, then try again.",
      explain: "Explain",
      optionalQuestion: "Ask a question about this selection (optional)",
      questionPlaceholder: "For example: How can I apply this at work?",
      analyzeSelection: "Analyze",
      analyzing: "Analyzing…",
      explanationReadyHint: "Enter a question for a targeted answer, or leave it blank for a concise explanation.",
      analysisPreparing: "Preparing transcript and prompt",
      analysisRequesting: "Waiting for the model to respond",
      analysisStreaming: "The model is generating the overview",
      analysisParsing: "Checking chapters and timestamps",
      analysisDone: "Overview complete",
      analysisError: "Overview stopped",
      learningRecord: "Learning record",
      learningRecordHelp: "Export this session for another Agent. Full transcript is excluded by default.",
      includeTranscript: "Include full transcript (larger and more sensitive)",
      copyForAgent: "Copy for Agent",
      downloadMarkdown: "Download Markdown",
      downloadJson: "Download JSON",
    },
    "zh-CN": {
      settings: "设置",
      checkUpdate: "检查更新",
      checkingUpdate: "检查中…",
      newVersion: ({ version }) => `新版本 v${version}`,
      latestVersion: "已是最新",
      updatedVersion: ({ version }) => `已更新 v${version}`,
      openingUpdate: "正在打开…",
      updateCheckFailed: "重试更新",
      transcript: "字幕",
      overview: "概览",
      notes: "笔记",
      original: "原文",
      chinese: "中文",
      bilingual: "双语",
      readyTitle: "准备生成摘要",
      readyDescription: "打开 YouTube 或 B 站视频，再点击页面里的“摘要”按钮即可开始。",
      fetchingTranscript: "正在获取字幕",
      extractingTranscript: "正在从视频中提取字幕…",
      errorTitle: "出错了",
      retry: "重试",
      fullTranscript: "完整字幕",
      copy: "复制",
      export: "导出",
      searchPlaceholder: "搜索词语或句子",
      chapters: "章节",
      chaptersPlaceholder: "章节将在这里显示",
      keyQuotes: "重点摘录",
      quotesPlaceholder: "打开此标签页后将提取重点摘录…",
      savedNotes: "已保存笔记",
      currentVideo: "当前视频",
      allNotes: "全部笔记",
      saveCurrent: "记录当前时间",
      noteIntro: "点击上方按钮、视频上的“记笔记”，或按 N 键，即可保存当前时间点的字幕内容。",
      noNotesCurrent: "当前视频还没有笔记。可点击“记录当前时间”或视频上的“记笔记”保存。",
      noNotesAny: "还没有已保存的笔记。打开视频并记录一个时间点即可开始。",
      followPlayback: "跟随播放",
      digest: "摘要",
      clickExtensionIcon: "请点击扩展图标",
      noteCapture: "记笔记",
      saving: "保存中…",
      saved: "已保存",
      saveFailed: "保存失败",
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
      noteGenericError: "笔记没有保存成功，请稍后重试。",
      noTranscriptForNote: "此视频没有可用字幕，暂时无法记录当前时间。你仍可在字幕中划线后保存。",
      bilibiliLoginForNote: "此字幕需要登录 B 站后才能读取，请确认登录状态再重试。",
      explain: "解释",
      optionalQuestion: "针对这段内容输入疑问（可选）",
      questionPlaceholder: "例如：这段方法在实际工作中应该怎么用？",
      analyzeSelection: "开始分析",
      analyzing: "正在分析…",
      explanationReadyHint: "输入问题可获得针对性回答；留空则按原方式简要解释。",
      analysisPreparing: "正在整理字幕和提示词",
      analysisRequesting: "正在等待模型开始响应",
      analysisStreaming: "模型正在生成概览",
      analysisParsing: "正在校验章节和时间戳",
      analysisDone: "概览已完成",
      analysisError: "概览已停止",
      learningRecord: "本次学习记录",
      learningRecordHelp: "导出给其他 Agent 阅读。默认不包含完整字幕。",
      includeTranscript: "包含完整字幕（体积更大，也更敏感）",
      copyForAgent: "复制给 Agent",
      downloadMarkdown: "下载 Markdown",
      downloadJson: "下载 JSON",
    },
  };

  function normalizePreference(value) {
    return PREFERENCES.has(value) ? value : "zh-CN";
  }

  function resolveLanguage(preference, browserLanguage = "") {
    const normalized = normalizePreference(preference);
    if (normalized !== "auto") return normalized;
    return String(browserLanguage).toLowerCase().startsWith("zh")
      ? "zh-CN"
      : "en";
  }

  function translate(preference, key, params = {}, browserLanguage = "") {
    const language = resolveLanguage(preference, browserLanguage);
    const value = COPY[language]?.[key] ?? COPY["zh-CN"][key] ?? key;
    return typeof value === "function" ? value(params) : value;
  }

  function applyDocument(documentLike, preference, browserLanguage = "") {
    if (!documentLike?.querySelectorAll) return resolveLanguage(preference, browserLanguage);
    const language = resolveLanguage(preference, browserLanguage);
    if (documentLike.documentElement) documentLike.documentElement.lang = language;
    for (const element of documentLike.querySelectorAll("[data-ui-i18n]")) {
      element.textContent = translate(language, element.dataset.uiI18n);
    }
    for (const element of documentLike.querySelectorAll("[data-ui-i18n-placeholder]")) {
      element.setAttribute(
        "placeholder",
        translate(language, element.dataset.uiI18nPlaceholder),
      );
    }
    for (const element of documentLike.querySelectorAll("[data-ui-i18n-aria-label]")) {
      element.setAttribute(
        "aria-label",
        translate(language, element.dataset.uiI18nAriaLabel),
      );
    }
    return language;
  }

  function browserLanguage(chromeApi, navigatorLike) {
    return (
      chromeApi?.i18n?.getUILanguage?.() ||
      navigatorLike?.language ||
      "zh-CN"
    );
  }

  function outputLanguageInstruction(outputLanguage, interfaceLanguage) {
    const normalized = ["interface", "zh-CN", "en", "source"].includes(
      outputLanguage,
    )
      ? outputLanguage
      : "interface";
    const target =
      normalized === "interface" ? resolveLanguage(interfaceLanguage) : normalized;
    if (target === "zh-CN") {
      return "Write chapter titles, summaries, and explanations in Simplified Chinese. Keep direct transcript quotes in the speaker's original language.";
    }
    if (target === "en") {
      return "Write chapter titles, summaries, and explanations in English. Keep direct transcript quotes in the speaker's original language.";
    }
    return "Write summaries and explanations in the source video's language. Keep direct transcript quotes in the speaker's original language.";
  }

  return {
    COPY,
    LANGUAGE_STORAGE_KEY,
    normalizePreference,
    resolveLanguage,
    translate,
    applyDocument,
    browserLanguage,
    outputLanguageInstruction,
  };
});
