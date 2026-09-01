const test = require("node:test");
const assert = require("node:assert/strict");

const platforms = require("../platforms.js");

const YOUTUBE_ID = "ydTeb_I0b94";
const BVID = "BV1GJ411x7h7";

test("YouTube keeps its historical storage key", () => {
  assert.deepEqual(
    platforms.parseVideoRef(`https://www.youtube.com/watch?v=${YOUTUBE_ID}&list=abc`),
    {
      platform: "youtube",
      sourceVideoId: YOUTUBE_ID,
      page: 1,
      storageId: YOUTUBE_ID,
    },
  );
});

test("Bilibili video and list pages use a BV plus part storage key", () => {
  assert.deepEqual(
    platforms.parseVideoRef(`https://www.bilibili.com/video/${BVID}?p=3&t=12`),
    {
      platform: "bilibili",
      sourceVideoId: BVID,
      page: 3,
      storageId: `bilibili:${BVID}:p3`,
    },
  );
  assert.deepEqual(
    platforms.parseVideoRef(`https://www.bilibili.com/list/watchlater?bvid=${BVID}&p=2`),
    {
      platform: "bilibili",
      sourceVideoId: BVID,
      page: 2,
      storageId: `bilibili:${BVID}:p2`,
    },
  );
});

test("unsupported and malformed pages are rejected", () => {
  assert.equal(platforms.parseVideoRef("https://www.bilibili.com/"), null);
  assert.equal(platforms.parseVideoRef("https://example.com/video/BV1GJ411x7h7"), null);
  assert.equal(platforms.parseVideoRef("not a url"), null);
  assert.equal(platforms.isSupportedSiteUrl("https://example.com/"), false);
});

test("canonical links preserve Bilibili parts and platform timestamp syntax", () => {
  assert.equal(
    platforms.canonicalVideoUrl(
      { platform: "youtube", sourceVideoId: YOUTUBE_ID, page: 1 },
      95,
    ),
    `https://www.youtube.com/watch?v=${YOUTUBE_ID}&t=95s`,
  );
  assert.equal(
    platforms.canonicalVideoUrl(
      { platform: "bilibili", sourceVideoId: BVID, page: 2 },
      95,
    ),
    `https://www.bilibili.com/video/${BVID}?p=2&t=95`,
  );
});
