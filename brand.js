(function attachKanWanLaBrand(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KANWANLA_BRAND = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBrandApi() {
  "use strict";

  const PRODUCT_NAME_ZH = "看完啦";
  const PRODUCT_NAME_EN = "KanWanLa";
  const PRODUCT_SLUG = "kanwanla";

  const STORAGE_KEYS = Object.freeze({
    updateState: "kanwanla_update_state",
    annotations: "kanwanla_annotations",
    learningRecordRevisions: "kanwanla_learning_record_revisions",
  });

  // These identifiers are read-only upgrade inputs from versions released
  // before v2.2.0. They are deliberately kept here, out of product copy and
  // new writes, so existing users retain their local data after the rename.
  const LEGACY_STORAGE_KEYS = Object.freeze({
    updateState: "kanwanle_update_state",
    annotations: "kanwanle_annotations",
    learningRecordRevisions: "kanwanle_learning_record_revisions",
  });

  async function readMigratedValue(storage, keyName, fallbackValue) {
    const currentKey = STORAGE_KEYS[keyName];
    const legacyKey = LEGACY_STORAGE_KEYS[keyName];
    if (!currentKey || !legacyKey) {
      throw new Error(`未知的看完啦存储项：${keyName}`);
    }
    if (typeof storage?.get !== "function" || typeof storage?.set !== "function") {
      throw new Error("看完啦数据迁移缺少浏览器存储环境。");
    }

    const stored = await storage.get([currentKey, legacyKey]);
    if (Object.hasOwn(stored || {}, currentKey)) return stored[currentKey];
    if (!Object.hasOwn(stored || {}, legacyKey)) return fallbackValue;

    const migrated = stored[legacyKey];
    await storage.set({ [currentKey]: migrated });
    return migrated;
  }

  return {
    PRODUCT_NAME_ZH,
    PRODUCT_NAME_EN,
    PRODUCT_SLUG,
    STORAGE_KEYS,
    LEGACY_STORAGE_KEYS,
    readMigratedValue,
  };
});
