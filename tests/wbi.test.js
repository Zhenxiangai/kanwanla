const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const WBI = require("../lib/wbi.js");

const IMG_KEY = "7cd084941338484aae1ad9425b84077c";
const SUB_KEY = "4932caff0ff746eab6f01bf08b70ac45";

test("bundled MD5 matches Node crypto", () => {
  for (const sample of ["", "abc", "中文字幕测试", "a".repeat(64)]) {
    assert.equal(
      WBI.md5(sample),
      crypto.createHash("md5").update(sample, "utf8").digest("hex"),
    );
  }
});

test("WBI signing matches the official example vector", () => {
  assert.equal(
    WBI.getMixinKey(IMG_KEY, SUB_KEY),
    "ea1db124af3c7062474693fa704f4ff8",
  );
  const signed = WBI.signParams(
    { foo: "114", bar: "514", zab: 1919810 },
    { imgKey: IMG_KEY, subKey: SUB_KEY },
    1702204169,
  );
  assert.equal(signed.w_rid, "8f6f2b5b3d485fe1886cec6a0be8c5d4");
});

test("WBI query encoding follows Bilibili rules", () => {
  assert.equal(
    WBI.buildQuery({ foo: "one one four", bar: "五一四", unsafe: "he!l'l(o)*" }),
    "bar=%E4%BA%94%E4%B8%80%E5%9B%9B&foo=one%20one%20four&unsafe=hello",
  );
});

test("WBI keys are cached and fetched with Bilibili cookies", async () => {
  WBI.clearKeyCache();
  let calls = 0;
  let seenInit;
  const fetchImpl = async (_url, init) => {
    calls += 1;
    seenInit = init;
    return {
      ok: true,
      json: async () => ({
        data: {
          wbi_img: {
            img_url: `https://i0.hdslb.com/bfs/wbi/${IMG_KEY}.png`,
            sub_url: `https://i0.hdslb.com/bfs/wbi/${SUB_KEY}.png`,
          },
        },
      }),
    };
  };
  await WBI.fetchWbiKeys({ fetchImpl });
  await WBI.fetchWbiKeys({ fetchImpl });
  assert.equal(calls, 1);
  assert.equal(seenInit.credentials, "include");
  WBI.clearKeyCache();
});
