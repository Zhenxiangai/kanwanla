const test = require("node:test");
const assert = require("node:assert/strict");

const API = require("../lib/bili-api.js");

const BVID = "BV1GJ411x7h7";

test("multipart metadata selects the requested cid, title, and duration", () => {
  const info = API.normalizeVideoInfo(
    {
      bvid: BVID,
      aid: 123,
      title: "Series",
      desc: "Description",
      owner: { name: "UP owner" },
      pages: [
        { page: 1, cid: 111, part: "Part one", duration: 30 },
        { page: 2, cid: 222, part: "Part two", duration: 60 },
      ],
    },
    2,
  );
  assert.equal(info.cid, 222);
  assert.equal(info.title, "Part two");
  assert.equal(info.duration, 60);
  assert.equal(info.owner, "UP owner");
  assert.equal(info.pageCount, 2);
});

test("subtitle tracks normalize CDN URLs and prefer human Chinese", () => {
  const tracks = API.normalizeSubtitleTracks({
    subtitle: {
      subtitles: [
        {
          id: 1,
          lan: "ai-zh",
          lan_doc: "中文自动",
          subtitle_url: "//aisubtitle.hdslb.com/ai.json",
          ai_status: 2,
        },
        {
          id: 2,
          lan: "zh-CN",
          lan_doc: "中文",
          subtitle_url: "//i0.hdslb.com/human.json",
        },
      ],
    },
  });
  assert.equal(tracks[0].url, "https://aisubtitle.hdslb.com/ai.json");
  assert.equal(tracks[0].isAi, true);
  assert.equal(API.pickSubtitleTrack(tracks).lang, "zh-CN");
});

test("subtitle body becomes seekable transcript entries", () => {
  assert.deepEqual(API.normalizeSubtitleBody({
    body: [
      { from: 0, to: 2.5, content: "第一句" },
      { from: 2.5, to: 5, content: "  第二句  " },
      { from: 5, to: 6, content: "   " },
    ],
  }), [
    { text: "第一句，", start: 0, duration: 2.5 },
    { text: "第二句，", start: 2.5, duration: 2.5 },
  ]);
});

test("unpunctuated Chinese Bilibili captions gain readable cue boundaries", () => {
  const entries = API.normalizeSubtitleBody({
    body: [
      {
        from: 0,
        to: 6,
        content: "这是第一段没有标点的中文字幕所以阅读起来比较费劲",
      },
      { from: 6, to: 8, content: "已经有标点。" },
      { from: 8, to: 10, content: "English caption" },
    ],
  });

  assert.match(entries[0].text, /[，。！？]$/);
  assert.equal(entries[1].text, "已经有标点。");
  assert.equal(entries[2].text, "English caption");
});

test("video and subtitle-list API requests include browser cookies", async () => {
  const calls = [];
  const videoFetch = async (url, init) => {
    calls.push([url, init]);
    return {
      ok: true,
      json: async () => ({
        code: 0,
        data: { bvid: BVID, aid: 1, cid: 2, title: "t", duration: 10 },
      }),
    };
  };
  await API.fetchVideoInfo(BVID, { fetchImpl: videoFetch });
  assert.equal(calls[0][1].credentials, "include");

  const stubWbi = {
    fetchWbiKeys: async () => ({ imgKey: "img", subKey: "sub" }),
    signedUrl: (base) => `${base}?w_rid=signed`,
  };
  const listFetch = async (url, init) => {
    calls.push([url, init]);
    return {
      ok: true,
      json: async () => ({ code: 0, data: { subtitle: { subtitles: [] } } }),
    };
  };
  await API.fetchSubtitleTracks(
    { aid: 1, cid: 2, bvid: BVID },
    { fetchImpl: listFetch, wbi: stubWbi },
  );
  assert.match(calls[1][0], /w_rid=signed/);
  assert.equal(calls[1][1].credentials, "include");
});

test("subtitle downloads omit cookies and API errors keep a stable code", async () => {
  let seenInit;
  const entries = await API.fetchSubtitleTrackContent("https://i0.hdslb.com/a.json", {
    fetchImpl: async (_url, init) => {
      seenInit = init;
      return {
        ok: true,
        json: async () => ({ body: [{ from: 0, to: 1, content: "hello" }] }),
      };
    },
  });
  assert.equal(seenInit.credentials, "omit");
  assert.equal(entries[0].text, "hello");

  await assert.rejects(
    () =>
      API.fetchVideoInfo(BVID, {
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ code: -352, message: "blocked" }),
        }),
      }),
    (error) => error.code === "RISK_CONTROL",
  );
});
