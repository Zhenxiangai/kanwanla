/**
 * Bilibili WBI request signing.
 * Adapted from https://github.com/biuworks/bilibili-digest (MIT).
 * Copyright (c) 2026 k1234567.
 */
var BILI_WBI = (() => {
  const MD5_SHIFTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];

  const MD5_SINE = new Int32Array(64);
  for (let i = 0; i < 64; i += 1) {
    MD5_SINE[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  }

  const rotateLeft = (value, bits) =>
    ((value << bits) | (value >>> (32 - bits))) | 0;

  function md5(input) {
    const message = new TextEncoder().encode(String(input));
    const bitLength = message.length * 8;
    const paddedLength = (((message.length + 8) >> 6) + 1) << 6;
    const padded = new Uint8Array(paddedLength);
    padded.set(message);
    padded[message.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, bitLength >>> 0, true);
    view.setUint32(paddedLength - 4, Math.floor(bitLength / 4294967296), true);

    let a0 = 0x67452301 | 0;
    let b0 = 0xefcdab89 | 0;
    let c0 = 0x98badcfe | 0;
    let d0 = 0x10325476 | 0;
    const words = new Int32Array(16);

    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let i = 0; i < 16; i += 1) {
        words[i] = view.getInt32(offset + i * 4, true);
      }
      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;

      for (let i = 0; i < 64; i += 1) {
        let f;
        let g;
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }
        f = (f + a + MD5_SINE[i] + words[g]) | 0;
        a = d;
        d = c;
        c = b;
        b = (b + rotateLeft(f, MD5_SHIFTS[i])) | 0;
      }

      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    const out = new DataView(new ArrayBuffer(16));
    out.setInt32(0, a0, true);
    out.setInt32(4, b0, true);
    out.setInt32(8, c0, true);
    out.setInt32(12, d0, true);
    let hex = "";
    for (let i = 0; i < 16; i += 1) {
      hex += out.getUint8(i).toString(16).padStart(2, "0");
    }
    return hex;
  }

  const MIXIN_KEY_ENC_TAB = Object.freeze([
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52,
  ]);

  function keyFromImageUrl(url) {
    const name = String(url || "").split("/").pop().split("?")[0];
    const dot = name.lastIndexOf(".");
    return dot === -1 ? name : name.slice(0, dot);
  }

  function getMixinKey(imgKey, subKey) {
    const raw = `${imgKey || ""}${subKey || ""}`;
    if (raw.length < 64) throw new Error("B 站返回了无效的 WBI 密钥。");
    let mixin = "";
    for (const index of MIXIN_KEY_ENC_TAB) mixin += raw[index];
    return mixin.slice(0, 32);
  }

  function buildQuery(params) {
    return Object.keys(params)
      .sort()
      .map((key) => {
        const value = String(params[key] ?? "").replace(/[!'()*]/g, "");
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");
  }

  function signParams(params, keys, nowSeconds) {
    const mixinKey = getMixinKey(keys?.imgKey, keys?.subKey);
    const wts =
      Number.isFinite(nowSeconds) && nowSeconds > 0
        ? Math.floor(nowSeconds)
        : Math.floor(Date.now() / 1000);
    const signed = { ...params, wts };
    return { ...signed, w_rid: md5(buildQuery(signed) + mixinKey) };
  }

  function signedUrl(baseUrl, params, keys, nowSeconds) {
    const signed = signParams(params, keys, nowSeconds);
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${buildQuery(signed)}`;
  }

  const NAV_URL = "https://api.bilibili.com/x/web-interface/nav";
  const KEY_TTL_MS = 60 * 60 * 1000;
  let cachedKeys = null;

  function parseNavResponse(data) {
    const imgKey = keyFromImageUrl(data?.data?.wbi_img?.img_url);
    const subKey = keyFromImageUrl(data?.data?.wbi_img?.sub_url);
    if (!imgKey || !subKey) throw new Error("B 站没有返回 WBI 密钥。");
    return { imgKey, subKey };
  }

  async function fetchWbiKeys({ fetchImpl = fetch, force = false } = {}) {
    if (!force && cachedKeys && Date.now() - cachedKeys.fetchedAt < KEY_TTL_MS) {
      return cachedKeys.keys;
    }
    const response = await fetchImpl(NAV_URL, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`无法加载 B 站 WBI 密钥：HTTP ${response.status}`);
    }
    const keys = parseNavResponse(await response.json());
    cachedKeys = { keys, fetchedAt: Date.now() };
    return keys;
  }

  function clearKeyCache() {
    cachedKeys = null;
  }

  return {
    md5,
    keyFromImageUrl,
    getMixinKey,
    buildQuery,
    signParams,
    signedUrl,
    parseNavResponse,
    fetchWbiKeys,
    clearKeyCache,
    NAV_URL,
    MIXIN_KEY_ENC_TAB,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BILI_WBI;
}
