const YTD_OPTIONS = (() => {
  const LANGUAGE_STORAGE_KEY = "ytd_options_language";
  const PREVIEW_STORAGE_PREFIX = "youtubeDigestPreview:";
  const SUPPORTED_LANGUAGES = new Set(["en", "zh-CN"]);
  const SUPPORTED_LANGUAGE_PREFERENCES = new Set(["en", "zh-CN", "auto"]);

  const COPY = {
    en: {
      pageTitle: "KanWanLa Settings",
      languageGroupLabel: "Interface language",
      automatic: "Auto",
      heading: "Bring your own API keys",
      lede:
        "Keys stay in this browser profile and are sent only to Supadata and SiliconFlow. This open-source extension has no developer server or analytics.",
      transcriptProvider: "YouTube transcript service",
      supadataApiKeyLabel: "Supadata API key",
      supadataApiKeyPlaceholder: "Paste your Supadata key",
      supadataHelp:
        "Optional. Used only to fetch timestamped YouTube subtitles. ",
      supadataLink: "Create a Supadata account and key",
      supadataHelpSuffix:
        ". Supadata generates the key during onboarding.",
      youtubeTranscriptModeLabel: "When native captions are unavailable",
      youtubeTranscriptModeNative:
        "Use native captions only (faster, lower credit use)",
      youtubeTranscriptModeAuto:
        "Use Supadata AI transcription as fallback",
      youtubeTranscriptModeHelp:
        "AI transcription is opt-in. It takes longer and Supadata charges generated-transcript credits by video duration.",
      bilibiliTranscriptProvider: "Bilibili transcript service",
      bilibiliProviderSummaryLabel: "Bilibili caption source",
      bilibiliProviderName: "Official Bilibili captions",
      bilibiliProviderBadge: "No API key",
      bilibiliTranscriptHelp:
        "Uses official Bilibili caption tracks. Some videos require you to be signed in to Bilibili.",
      aiProvider: "AI features (YouTube and Bilibili)",
      providerSummaryLabel: "Supported AI provider",
      providerBadge: "Supported in this version",
      siliconflowApiKeyLabel: "SiliconFlow API key",
      siliconflowApiKeyPlaceholder: "Paste your SiliconFlow key",
      siliconflowHelp:
        "Used for overviews, explanations, translation, and loading the models available to your account. Notes are saved locally without model processing. ",
      siliconflowSignupLink: "Create a SiliconFlow account",
      siliconflowHelpSuffix: ".",
      aiModelLabel: "AI model",
      aiModelPlaceholder: "DeepSeek V4 Flash (default; changeable)",
      loadModels: "Load models",
      aiModelHelp:
        "DeepSeek V4 Flash is selected by default. After entering your key, you can still load and choose another available model or enter an exact model ID manually.",
      outputLanguageLabel: "AI output language",
      outputLanguageInterface: "Follow interface language",
      outputLanguageChinese: "Chinese",
      outputLanguageEnglish: "English",
      outputLanguageSource: "Original video language",
      outputLanguageHelp:
        "Controls overviews and explanations only. Transcript display remains a separate setting in the side panel.",
      privacyNote:
        "When you use AI features, SiliconFlow and your selected model receive the transcript and relevant video context. Review SiliconFlow's terms and model pricing before saving.",
      saveSettings: "Save settings",
      localRemix: "Local remix",
      customizationTitle: "Want to use another AI provider?",
      customizationPurpose: "Edit and copy a safe prompt for your coding agent",
      agentBadge: "Coding agent ready",
      customizationIntro:
        "You can edit the prompt directly. Complete these three steps before copying:",
      customizationStepFolder:
        "Open the extracted KanWanLa project folder in your coding agent.",
      customizationStepReplace:
        "Replace [PROVIDER] and [MODEL] with the service and model you want to use.",
      customizationStepKeys:
        "Never include API keys in the prompt or chat. Enter them yourself after the code is ready.",
      customizationPromptLabel: "Editable customization prompt",
      customizationReminderLabel: "Prompt reminder",
      customizationReminder:
        "Before copying, replace [PROVIDER] and [MODEL] with the provider and model you want to use.",
      customizationPrompt:
        "Customize this local KanWanLa workspace to use [PROVIDER] with [MODEL]. Work only in the current workspace. Before editing, verify that it contains manifest.json and that the manifest name is 看完啦. If verification fails, stop and ask me to open the extracted KanWanLa project folder in my coding agent. Do not search other folders, edit a guessed copy, assume an installation path, or claim Chrome can reveal the absolute OS source path. Update the provider's API endpoint, request format, and minimum Chrome host permissions. Preserve bring-your-own-key and local Chrome storage. Never put API keys in source code, commits, logs, screenshots, this prompt, or chat; after the code is ready, tell me where to enter the key myself. Keep SiliconFlow-only request fields and model discovery isolated to SiliconFlow. Handle provider-specific rules separately so one provider does not affect another. Update README.md, README.en.md, README.zh-CN.md, PRIVACY.md, SECURITY.md, and tests. Run npm test, npm run check, and npm run package. Then explain how to reload the unpacked extension and test it on YouTube and Bilibili videos.",
      copyCustomizationPrompt: "Copy edited prompt",
      localData: "Local data",
      localDataHelp:
        "Digests, translations, and notes are stored only in this browser profile. You can remove them at any time.",
      clearCache: "Clear cached digests",
      deleteNotes: "Delete all notes",
      resetData: "Reset extension data",
      footer:
        'Read <a href="PRIVACY.md" target="_blank">PRIVACY.md</a> in the repository for the complete data-flow description.',
      migrationWarning:
        "Previous AI provider settings were removed safely. Your Supadata key was kept, the old AI key was cleared, and DeepSeek V4 Flash is now the default. Enter a SiliconFlow API key; you may change the model at any time.",
      saving: "Saving…",
      addSupadataKey: "Add a Supadata API key.",
      addSiliconFlowKey: "Add a SiliconFlow API key.",
      chooseAiModel: "Load or enter a SiliconFlow model ID.",
      loadingModels: "Loading text chat models…",
      modelsLoaded: ({ count }) =>
        `Loaded ${count} text chat model${count === 1 ? "" : "s"}.`,
      noModelsFound: "No text chat models were returned. Enter a model ID manually.",
      modelListUnauthorized:
        "SiliconFlow rejected this key. Check the key and account access.",
      modelListRateLimited:
        "SiliconFlow rate-limited the model list request. Try again shortly.",
      modelListFailed:
        "Could not load models. You can still enter an exact model ID manually.",
      saved: "Saved. Reopen KanWanLa to use these settings.",
      saveFailed: "Could not save settings. Please try again.",
      copying: "Copying…",
      promptCopied: "Edited prompt copied.",
      copyFailed:
        "Could not copy the prompt. Select the prompt text and copy it manually.",
      clearedDigests: ({ count }) =>
        `Cleared ${count} cached digest${count === 1 ? "" : "s"}.`,
      notesDeleted: "Deleted all saved notes.",
      resetConfirm:
        "Delete API keys, cached digests, translations, and saved notes from this browser profile?",
      allDataDeleted: "All KanWanLa data was deleted.",
      settingsLoadFailed:
        "Could not load saved settings. You can still preview this page.",
    },
    "zh-CN": {
      pageTitle: "看完啦设置",
      languageGroupLabel: "界面语言",
      automatic: "自动",
      heading: "使用你自己的 API 密钥",
      lede:
        "密钥仅保存在当前浏览器个人资料中，只会发送给 Supadata 和硅基流动。本开源扩展没有开发者服务器，也不使用分析服务。",
      transcriptProvider: "YouTube 字幕服务",
      supadataApiKeyLabel: "Supadata API 密钥",
      supadataApiKeyPlaceholder: "粘贴 Supadata API 密钥",
      supadataHelp: "可选。仅用于获取带时间戳的 YouTube 字幕。",
      supadataLink: "创建 Supadata 账号并获取密钥",
      supadataHelpSuffix: "。Supadata 会在引导流程中生成密钥。",
      youtubeTranscriptModeLabel: "没有原生字幕时",
      youtubeTranscriptModeNative: "仅使用原生字幕（更快、更省额度）",
      youtubeTranscriptModeAuto: "使用 Supadata AI 转写作为后备",
      youtubeTranscriptModeHelp:
        "AI 转写需要用户主动开启，等待时间更长，Supadata 会按视频时长消耗生成式转写额度。",
      bilibiliTranscriptProvider: "B 站字幕服务",
      bilibiliProviderSummaryLabel: "B 站字幕来源",
      bilibiliProviderName: "B 站官方字幕",
      bilibiliProviderBadge: "无需 API 密钥",
      bilibiliTranscriptHelp:
        "直接读取 B 站官方字幕轨；部分视频需要先登录 B 站账号。",
      aiProvider: "AI 功能服务（YouTube / B 站通用）",
      providerSummaryLabel: "支持的 AI 服务",
      providerBadge: "当前版本支持",
      siliconflowApiKeyLabel: "硅基流动 API 密钥",
      siliconflowApiKeyPlaceholder: "粘贴硅基流动 API 密钥",
      siliconflowHelp:
        "用于生成概览、解释内容、翻译字幕，以及读取当前账号可用的模型列表。笔记直接在浏览器内保存，不经过模型处理。",
      siliconflowSignupLink: "注册硅基流动账号",
      siliconflowHelpSuffix: "。",
      aiModelLabel: "AI 模型",
      aiModelPlaceholder: "DeepSeek V4 Flash（默认，可更换）",
      loadModels: "加载模型",
      aiModelHelp:
        "默认使用 DeepSeek V4 Flash。填写密钥后仍可加载并选择其他可用模型，也可以手动填写准确的模型 ID。",
      outputLanguageLabel: "AI 输出语言",
      outputLanguageInterface: "跟随界面语言",
      outputLanguageChinese: "中文",
      outputLanguageEnglish: "English",
      outputLanguageSource: "原视频语言",
      outputLanguageHelp:
        "仅控制概览和解释的输出；字幕的原文、中文、双语仍在侧栏单独选择。",
      privacyNote:
        "使用 AI 功能时，硅基流动及你选择的模型会收到字幕和相关视频上下文。保存前请查看硅基流动的服务条款和模型价格。",
      saveSettings: "保存设置",
      localRemix: "本地改造",
      customizationTitle: "想使用其他 AI 服务？",
      customizationPurpose: "编辑并复制一段可安全交给编程 Agent 的提示词",
      agentBadge: "可交给编程 Agent",
      customizationIntro: "你可以直接编辑提示词。复制前完成以下三步：",
      customizationStepFolder:
        "在编程 Agent 中打开“看完啦”解压后的项目文件夹。",
      customizationStepReplace:
        "把 [PROVIDER] 和 [MODEL] 替换成你想使用的服务和模型。",
      customizationStepKeys:
        "不要在提示词或聊天中加入 API 密钥。代码准备好后，请自行填写。",
      customizationPromptLabel: "可编辑的自定义提示词",
      customizationReminderLabel: "提示词提醒",
      customizationReminder:
        "复制前，请先把 [PROVIDER] 和 [MODEL] 替换成你想使用的服务和模型。",
      customizationPrompt:
        "请把当前本地“看完啦”工作区改为使用 [PROVIDER] 提供的 [MODEL]。只在当前工作区中操作。编辑前，先确认其中包含 manifest.json，且 manifest 中的 name 是“看完啦”。如果验证失败，请停止，并让我在编程 Agent 中打开“看完啦”解压后的项目文件夹。不要搜索其他文件夹，不要编辑猜测的副本，不要假设安装路径，也不要声称 Chrome 可以显示操作系统中的绝对源码路径。更新该服务的 API endpoint、请求格式和最少的 Chrome host permissions。保留用户自带密钥模式和 Chrome 本地存储。不要把 API 密钥写入源代码、提交记录、日志、截图、这段提示词或聊天；代码准备好后，请告诉我应该在哪里自行填写密钥。硅基流动专用的请求字段和模型发现逻辑继续只用于硅基流动。新服务的专属规则请单独处理，避免相互影响。更新 README.md、README.zh-CN.md、PRIVACY.md、SECURITY.md 和测试。运行 npm test、npm run check 和 npm run package。最后，说明如何重新加载已解压的扩展，并在 YouTube 和 B 站视频上测试。",
      copyCustomizationPrompt: "复制编辑后的提示词",
      localData: "本地数据",
      localDataHelp:
        "摘要、翻译和笔记仅保存在当前浏览器个人资料中。你可以随时删除。",
      clearCache: "清除缓存的摘要",
      deleteNotes: "删除全部笔记",
      resetData: "重置扩展数据",
      footer:
        '完整数据流说明请参阅仓库中的 <a href="PRIVACY.md" target="_blank">PRIVACY.md</a>。',
      migrationWarning:
        "已安全移除之前的 AI 服务设置。Supadata 密钥已保留，旧 AI 密钥已清除，并已默认选择 DeepSeek V4 Flash。请输入硅基流动 API 密钥；模型可随时更换。",
      saving: "正在保存…",
      addSupadataKey: "请添加 Supadata API 密钥。",
      addSiliconFlowKey: "请添加硅基流动 API 密钥。",
      chooseAiModel: "请加载或填写硅基流动模型 ID。",
      loadingModels: "正在加载文本对话模型…",
      modelsLoaded: ({ count }) => `已加载 ${count} 个文本对话模型。`,
      noModelsFound: "没有返回文本对话模型，请手动填写模型 ID。",
      modelListUnauthorized: "硅基流动拒绝了此密钥，请检查密钥和账号权限。",
      modelListRateLimited: "硅基流动限制了模型列表请求，请稍后重试。",
      modelListFailed: "无法加载模型；你仍可手动填写准确的模型 ID。",
      saved: "已保存。请重新打开“看完啦” 以使用这些设置。",
      saveFailed: "无法保存设置，请重试。",
      copying: "正在复制…",
      promptCopied: "已复制编辑后的提示词。",
      copyFailed: "无法复制提示词。请选中提示词文本并手动复制。",
      clearedDigests: ({ count }) => `已清除 ${count} 条缓存摘要。`,
      notesDeleted: "已删除全部已保存的笔记。",
      resetConfirm:
        "要从当前浏览器个人资料中删除 API 密钥、缓存摘要、翻译和已保存的笔记吗？",
      allDataDeleted: "已删除全部“看完啦”数据。",
      settingsLoadFailed: "无法加载已保存的设置，但你仍可预览此页面。",
    },
  };

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.has(language) ? language : "zh-CN";
  }

  function normalizeLanguagePreference(language) {
    return SUPPORTED_LANGUAGE_PREFERENCES.has(language)
      ? language
      : "zh-CN";
  }

  function resolveLanguagePreference(preference, browserLanguage = "") {
    const normalized = normalizeLanguagePreference(preference);
    if (normalized !== "auto") return normalized;
    return String(browserLanguage).toLowerCase().startsWith("zh")
      ? "zh-CN"
      : "en";
  }

  function translate(language, key, params = {}) {
    const normalizedLanguage = normalizeLanguage(language);
    const value = COPY[normalizedLanguage][key] ?? COPY.en[key] ?? "";
    return typeof value === "function" ? value(params) : value;
  }

  function createStorageAdapter(chromeApi, fallbackStorage) {
    const chromeStorage = chromeApi?.storage?.local;
    const memoryStorage = new Map();

    function fallbackKeys() {
      const keys = [];
      if (!fallbackStorage) return keys;
      try {
        for (let index = 0; index < fallbackStorage.length; index += 1) {
          const key = fallbackStorage.key(index);
          if (key?.startsWith(PREVIEW_STORAGE_PREFIX)) keys.push(key);
        }
      } catch (_error) {
        return [];
      }
      return keys;
    }

    function readFallbackValue(key) {
      try {
        const rawValue = fallbackStorage?.getItem(
          `${PREVIEW_STORAGE_PREFIX}${key}`,
        );
        if (rawValue !== null && rawValue !== undefined) {
          return JSON.parse(rawValue);
        }
      } catch (_error) {
        // Fall through to memory when localStorage is unavailable or malformed.
      }
      return memoryStorage.get(key);
    }

    function writeFallbackValue(key, value) {
      memoryStorage.set(key, value);
      try {
        fallbackStorage?.setItem(
          `${PREVIEW_STORAGE_PREFIX}${key}`,
          JSON.stringify(value),
        );
      } catch (_error) {
        // The in-memory copy keeps a restricted preview functional.
      }
    }

    return {
      async get(keys) {
        if (chromeStorage) return chromeStorage.get(keys);

        const requestedKeys =
          keys === null
            ? [
                ...new Set([
                  ...memoryStorage.keys(),
                  ...fallbackKeys().map((key) =>
                    key.slice(PREVIEW_STORAGE_PREFIX.length),
                  ),
                ]),
              ]
            : Array.isArray(keys)
              ? keys
              : [keys];

        return Object.fromEntries(
          requestedKeys
            .map((key) => [key, readFallbackValue(key)])
            .filter(([, value]) => value !== undefined),
        );
      },

      async set(items) {
        if (chromeStorage) return chromeStorage.set(items);
        for (const [key, value] of Object.entries(items)) {
          writeFallbackValue(key, value);
        }
      },

      async remove(keys) {
        if (chromeStorage) return chromeStorage.remove(keys);
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          memoryStorage.delete(key);
          try {
            fallbackStorage?.removeItem(`${PREVIEW_STORAGE_PREFIX}${key}`);
          } catch (_error) {
            // Memory removal is sufficient for this preview session.
          }
        }
      },

      async clear() {
        if (chromeStorage) return chromeStorage.clear();
        memoryStorage.clear();
        for (const key of fallbackKeys()) {
          try {
            fallbackStorage.removeItem(key);
          } catch (_error) {
            // Continue clearing any remaining preview keys.
          }
        }
      },
    };
  }

  async function readPreferredLanguage(storage) {
    const stored = await storage.get(LANGUAGE_STORAGE_KEY);
    return normalizeLanguagePreference(stored[LANGUAGE_STORAGE_KEY]);
  }

  async function persistPreferredLanguage(storage, language) {
    const normalizedLanguage = normalizeLanguagePreference(language);
    await storage.set({ [LANGUAGE_STORAGE_KEY]: normalizedLanguage });
    return normalizedLanguage;
  }

  function updateLanguageButtonState(buttons, language) {
    const normalizedLanguage = normalizeLanguagePreference(language);
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.language === normalizedLanguage),
      );
    }
  }

  function updateLocalizedPrompt(textarea, prompt) {
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectionDirection = textarea.selectionDirection;
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;

    textarea.value = prompt;

    if (
      Number.isInteger(selectionStart) &&
      Number.isInteger(selectionEnd) &&
      typeof textarea.setSelectionRange === "function"
    ) {
      textarea.setSelectionRange(
        Math.min(selectionStart, prompt.length),
        Math.min(selectionEnd, prompt.length),
        selectionDirection || "none",
      );
    }
    textarea.scrollTop = scrollTop;
    textarea.scrollLeft = scrollLeft;
  }

  function createPromptDrafts() {
    return {
      en: translate("en", "customizationPrompt"),
      "zh-CN": translate("zh-CN", "customizationPrompt"),
    };
  }

  function switchPromptDraft(
    drafts,
    currentLanguage,
    nextLanguage,
    currentValue,
  ) {
    const normalizedCurrentLanguage = normalizeLanguage(currentLanguage);
    const normalizedNextLanguage = normalizeLanguage(nextLanguage);
    drafts[normalizedCurrentLanguage] = String(currentValue ?? "");
    if (typeof drafts[normalizedNextLanguage] !== "string") {
      drafts[normalizedNextLanguage] = translate(
        normalizedNextLanguage,
        "customizationPrompt",
      );
    }
    return {
      language: normalizedNextLanguage,
      prompt: drafts[normalizedNextLanguage],
    };
  }

  async function copyPromptValue(clipboard, value) {
    await clipboard.writeText(value);
  }

  function normalizeModelList(payload) {
    const models = Array.isArray(payload?.data) ? payload.data : [];
    return [
      ...new Set(
        models
          .map((model) => (typeof model?.id === "string" ? model.id.trim() : ""))
          .filter((modelId) =>
            /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(modelId),
          ),
      ),
    ].sort((left, right) => left.localeCompare(right));
  }

  async function fetchSiliconFlowModels(fetchImpl, modelsUrl, apiKey) {
    const normalizedKey = typeof apiKey === "string" ? apiKey.trim() : "";
    if (!normalizedKey) {
      const error = new Error("SiliconFlow API key is required.");
      error.code = "NO_AI_KEY";
      throw error;
    }

    const response = await fetchImpl(modelsUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${normalizedKey}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error("Could not load SiliconFlow models.");
      error.status = response.status;
      throw error;
    }
    return normalizeModelList(payload);
  }

  function populateModelOptions(doc, datalist, modelIds) {
    datalist.textContent = "";
    for (const modelId of modelIds) {
      const option = doc.createElement("option");
      option.value = modelId;
      datalist.appendChild(option);
    }
  }

  function getSafeLocalStorage(root) {
    try {
      return root.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function initialize(root = globalThis) {
    const doc = root.document;
    const settingsApi = root.YTD_SETTINGS;
    if (!doc || !settingsApi) return;

    const storage = createStorageAdapter(
      root.chrome,
      getSafeLocalStorage(root),
    );
    const form = doc.getElementById("settingsForm");
    const aiApiKeyInput = doc.getElementById("aiApiKey");
    const aiModelInput = doc.getElementById("aiModel");
    const outputLanguageInput = doc.getElementById("outputLanguage");
    const aiModelOptions = doc.getElementById("aiModelOptions");
    const loadModelsBtn = doc.getElementById("loadModelsBtn");
    const supadataApiKeyInput = doc.getElementById("supadataApiKey");
    const youtubeTranscriptModeInput = doc.getElementById(
      "youtubeTranscriptMode",
    );
    const customizationPrompt = doc.getElementById("customizationPrompt");
    const copyCustomizationPromptBtn = doc.getElementById(
      "copyCustomizationPromptBtn",
    );
    const copyStatus = doc.getElementById("copyStatus");
    const saveStatus = doc.getElementById("saveStatus");
    const modelStatus = doc.getElementById("modelStatus");
    const dataStatus = doc.getElementById("dataStatus");
    const languageButtons = [...doc.querySelectorAll("[data-language]")];
    const statusStates = new Map();
    const promptDrafts = createPromptDrafts();
    // The static HTML is Chinese, so there is no English flash before the
    // stored choice is applied. English remains available as an explicit opt-in.
    let currentLanguage = "zh-CN";
    let currentLanguagePreference = "zh-CN";

    function renderStatus(element) {
      const state = statusStates.get(element);
      element.textContent = state
        ? translate(currentLanguage, state.key, state.params)
        : "";
    }

    function setStatus(element, key, params = {}) {
      statusStates.set(element, { key, params });
      renderStatus(element);
    }

    function applyLanguage(languagePreference) {
      const normalizedPreference = normalizeLanguagePreference(
        languagePreference,
      );
      const language = resolveLanguagePreference(
        normalizedPreference,
        root.navigator?.language,
      );
      const nextDraft = switchPromptDraft(
        promptDrafts,
        currentLanguage,
        language,
        customizationPrompt.value,
      );
      currentLanguage = nextDraft.language;
      currentLanguagePreference = normalizedPreference;
      doc.documentElement.lang = currentLanguage;
      doc.title = translate(currentLanguage, "pageTitle");

      for (const element of doc.querySelectorAll("[data-i18n]")) {
        element.textContent = translate(
          currentLanguage,
          element.dataset.i18n,
        );
      }
      for (const element of doc.querySelectorAll("[data-i18n-html]")) {
        element.innerHTML = translate(
          currentLanguage,
          element.dataset.i18nHtml,
        );
      }
      for (const element of doc.querySelectorAll("[data-i18n-aria-label]")) {
        element.setAttribute(
          "aria-label",
          translate(currentLanguage, element.dataset.i18nAriaLabel),
        );
      }
      for (const element of doc.querySelectorAll("[data-i18n-placeholder]")) {
        element.setAttribute(
          "placeholder",
          translate(currentLanguage, element.dataset.i18nPlaceholder),
        );
      }

      updateLocalizedPrompt(
        customizationPrompt,
        nextDraft.prompt,
      );
      updateLanguageButtonState(languageButtons, currentLanguagePreference);
      for (const element of statusStates.keys()) renderStatus(element);
    }

    async function loadSettings() {
      try {
        const stored = await storage.get(settingsApi.STORAGE_KEY);
        const migration = settingsApi.migrateLegacyProvider(
          stored[settingsApi.STORAGE_KEY],
        );
        const settings = migration.settings;

        aiApiKeyInput.value = settings.aiApiKey;
        aiModelInput.value = settings.aiModel;
        outputLanguageInput.value = settings.outputLanguage;
        supadataApiKeyInput.value = settings.supadataApiKey;
        youtubeTranscriptModeInput.value = settings.youtubeTranscriptMode;
        if (migration.migrated) {
          await storage.set({ [settingsApi.STORAGE_KEY]: settings });
          setStatus(saveStatus, "migrationWarning");
        }
      } catch (_error) {
        setStatus(saveStatus, "settingsLoadFailed");
      }
    }

    async function loadOptions() {
      try {
        applyLanguage(await readPreferredLanguage(storage));
      } catch (_error) {
        applyLanguage("zh-CN");
      }
      await loadSettings();
    }

    async function saveSettings(event) {
      event.preventDefault();
      setStatus(saveStatus, "saving");

      const settings = settingsApi.normalize({
        provider: settingsApi.DEFAULTS.provider,
        aiApiKey: aiApiKeyInput.value,
        aiModel: aiModelInput.value,
        outputLanguage: outputLanguageInput.value,
        supadataApiKey: supadataApiKeyInput.value,
        youtubeTranscriptMode: youtubeTranscriptModeInput.value,
      });

      if (!settings.aiApiKey) {
        setStatus(saveStatus, "addSiliconFlowKey");
        return;
      }
      if (!settings.aiModel) {
        setStatus(saveStatus, "chooseAiModel");
        return;
      }

      try {
        await storage.set({ [settingsApi.STORAGE_KEY]: settings });
        setStatus(saveStatus, "saved");
      } catch (_error) {
        setStatus(saveStatus, "saveFailed");
      }
    }

    async function loadModels() {
      const apiKey = aiApiKeyInput.value.trim();
      if (!apiKey) {
        setStatus(modelStatus, "addSiliconFlowKey");
        return;
      }

      setStatus(modelStatus, "loadingModels");
      loadModelsBtn.disabled = true;
      try {
        const modelIds = await fetchSiliconFlowModels(
          root.fetch.bind(root),
          settingsApi.modelsUrl(settingsApi.DEFAULTS.aiBaseUrl),
          apiKey,
        );
        populateModelOptions(doc, aiModelOptions, modelIds);
        setStatus(
          modelStatus,
          modelIds.length ? "modelsLoaded" : "noModelsFound",
          { count: modelIds.length },
        );
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          setStatus(modelStatus, "modelListUnauthorized");
        } else if (error.status === 429) {
          setStatus(modelStatus, "modelListRateLimited");
        } else {
          setStatus(modelStatus, "modelListFailed");
        }
      } finally {
        loadModelsBtn.disabled = false;
      }
    }

    async function copyCustomizationPrompt() {
      setStatus(copyStatus, "copying");
      try {
        await copyPromptValue(
          root.navigator.clipboard,
          customizationPrompt.value,
        );
        setStatus(copyStatus, "promptCopied");
      } catch (_error) {
        setStatus(copyStatus, "copyFailed");
      }
    }

    async function clearCachedDigests() {
      const all = await storage.get(null);
      const keys = Object.keys(all).filter((key) => key.startsWith("digest_"));
      if (keys.length) await storage.remove(keys);
      setStatus(dataStatus, "clearedDigests", { count: keys.length });
    }

    async function clearNotes() {
      await storage.remove("ytd_notes");
      setStatus(dataStatus, "notesDeleted");
    }

    async function resetAllData() {
      const confirmed = root.confirm(
        translate(currentLanguage, "resetConfirm"),
      );
      if (!confirmed) return;

      await storage.clear();
      await persistPreferredLanguage(storage, currentLanguagePreference);
      await loadSettings();
      setStatus(dataStatus, "allDataDeleted");
    }

    form.addEventListener("submit", saveSettings);
    loadModelsBtn.addEventListener("click", loadModels);
    copyCustomizationPromptBtn.addEventListener(
      "click",
      copyCustomizationPrompt,
    );
    doc
      .getElementById("clearCacheBtn")
      .addEventListener("click", clearCachedDigests);
    doc.getElementById("clearNotesBtn").addEventListener("click", clearNotes);
    doc.getElementById("resetBtn").addEventListener("click", resetAllData);
    for (const button of languageButtons) {
      button.addEventListener("click", async () => {
        const language = button.dataset.language;
        applyLanguage(language);
        await persistPreferredLanguage(storage, language);
        await root.chrome?.runtime
          ?.sendMessage?.({
            action: "languageChanged",
            preference: normalizeLanguagePreference(language),
          })
          ?.catch?.(() => {});
      });
    }

    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", loadOptions, { once: true });
    } else {
      void loadOptions();
    }
  }

  return {
    COPY,
    LANGUAGE_STORAGE_KEY,
    copyPromptValue,
    createPromptDrafts,
    createStorageAdapter,
    fetchSiliconFlowModels,
    normalizeModelList,
    populateModelOptions,
    normalizeLanguage,
    normalizeLanguagePreference,
    resolveLanguagePreference,
    persistPreferredLanguage,
    readPreferredLanguage,
    translate,
    updateLanguageButtonState,
    updateLocalizedPrompt,
    switchPromptDraft,
    initialize,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_OPTIONS;
}

if (typeof document !== "undefined") {
  YTD_OPTIONS.initialize();
}
