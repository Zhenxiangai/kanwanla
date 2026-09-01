const test = require("node:test");
const assert = require("node:assert/strict");

const brand = require("../brand.js");

function createStorage(initial = {}) {
  const values = structuredClone(initial);
  return {
    values,
    storage: {
      get: async (keys) => {
        const requested = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(
          requested
            .filter((key) => Object.hasOwn(values, key))
            .map((key) => [key, structuredClone(values[key])]),
        );
      },
      set: async (next) => Object.assign(values, structuredClone(next)),
    },
  };
}

test("brand metadata uses the requested KanWanLa spelling", () => {
  assert.equal(brand.PRODUCT_NAME_ZH, "看完啦");
  assert.equal(brand.PRODUCT_NAME_EN, "KanWanLa");
  assert.equal(brand.PRODUCT_SLUG, "kanwanla");
});

test("legacy local data is copied to the new key on first read", async () => {
  const legacyKey = brand.LEGACY_STORAGE_KEYS.annotations;
  const currentKey = brand.STORAGE_KEYS.annotations;
  const browser = createStorage({ [legacyKey]: [{ id: "old-note" }] });

  const value = await brand.readMigratedValue(
    browser.storage,
    "annotations",
    [],
  );

  assert.deepEqual(value, [{ id: "old-note" }]);
  assert.deepEqual(browser.values[currentKey], [{ id: "old-note" }]);
  assert.deepEqual(browser.values[legacyKey], [{ id: "old-note" }]);
});

test("new local data wins and a missing value uses its fallback", async () => {
  const currentKey = brand.STORAGE_KEYS.learningRecordRevisions;
  const legacyKey = brand.LEGACY_STORAGE_KEYS.learningRecordRevisions;
  const browser = createStorage({
    [currentKey]: { current: 2 },
    [legacyKey]: { legacy: 1 },
  });

  assert.deepEqual(
    await brand.readMigratedValue(
      browser.storage,
      "learningRecordRevisions",
      {},
    ),
    { current: 2 },
  );
  assert.deepEqual(
    await brand.readMigratedValue(browser.storage, "updateState", {}),
    {},
  );
});
