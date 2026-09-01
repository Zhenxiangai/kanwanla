# Video Digest

[English](README.md) | [简体中文](README.zh-CN.md)

Turn YouTube and Bilibili videos into learning material with timestamped transcripts, bilingual reading, SiliconFlow-powered overviews, explanations, and notes.

Video Digest is a local, bring-your-own-key Chromium extension for Chrome and Edge. It has no developer-operated backend, account system, analytics, advertising, or included API credits, and it requires no local server.

> [!IMPORTANT]
> Video Digest is a derivative work based on [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest), used under the MIT License. This independently maintained fork preserves the upstream copyright notice and adds Bilibili support, SiliconFlow model selection, Chrome and Edge compatibility, and reliability improvements.

![Video Digest demo](YouTube%20Digest%20demo.png)

## What this fork adds

- Bilibili video and multipart-video support using Bilibili's official web APIs.
- SiliconFlow as the AI provider, defaulting to DeepSeek V4 Flash while retaining account model discovery and manual model-ID selection.
- Tested Chrome and Edge support for both supported video platforms.
- Faster long Bilibili overviews through cue grouping, bounded input, a smaller reasoning budget, and retryable timeout handling.
- Platform-aware transcript caching, Chinese-caption passthrough, and independent multipart-video data.

## Supported sites

- **YouTube:** standard watch pages. Native captions are retrieved through Supadata.
- **Bilibili:** `/video/` and `/list/` playback pages, including multipart videos. Subtitle metadata and files are retrieved from Bilibili's official web APIs.

YouTube keeps its historical cache and note identifiers. Every Bilibili part uses a namespaced cache key, so multipart videos remain independent.

## Features

- Read a seekable transcript beside the player and follow playback automatically.
- Click a transcript row, chapter, quote, or note to seek.
- Switch between original, Chinese, and aligned bilingual views.
- Display Chinese source captions directly without redundant translation requests.
- Generate chapters and key quotes only when Overview is opened.
- Explain selected transcript text and save timestamped notes.
- Use DeepSeek V4 Flash by default, load another model available to a SiliconFlow account, or enter a model ID manually.
- Cache transcripts, translations, analysis, reading position, and notes in browser-local extension storage.
- Run entirely in the extension, without Whisper, a companion app, or a developer backend.

## Requirements

- Chrome or Edge 116 or later.
- A SiliconFlow API key for AI features. DeepSeek V4 Flash is the default model and can be changed.
- A Supadata API key for YouTube transcript retrieval.
- For Bilibili tracks visible only to signed-in users, a normal Bilibili login in the same browser profile.

Never put API keys in chat, source files, screenshots, logs, or commits. Enter them only on the extension's Settings page.

## Install

1. Download the ZIP from the [latest GitHub release](https://github.com/Zhenxiangai/video-digest/releases/latest) and extract it to a permanent folder.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode** and click **Load unpacked**.
4. Select the folder containing `manifest.json`.
5. Open Video Digest Settings, enter your own API keys, and save. Keep the default DeepSeek V4 Flash model or load another SiliconFlow model.
6. Refresh any YouTube or Bilibili tabs that were already open.

After updating the files, click **Reload** on the Video Digest extension card and refresh the video page.

## Transcript sources

### YouTube

Video Digest sends a canonical YouTube watch URL to Supadata's transcript endpoint with `mode=native`. It does not request generated transcription. If a video has no native caption track, the extension reports that no transcript is available.

### Bilibili

Video Digest uses this sequence:

1. `api.bilibili.com/x/web-interface/view` resolves the BV number and selected part to its aid and cid.
2. `api.bilibili.com/x/player/wbi/v2` returns subtitle tracks using Bilibili's WBI signature.
3. The selected subtitle JSON is downloaded from a Bilibili `hdslb.com` host.

Bilibili API requests may include the browser's existing Bilibili cookies so tracks available to the signed-in user can be listed. Subtitle CDN downloads omit cookies. The extension does not request the Chrome `cookies` permission and never reads or stores cookie values itself.

Track preference is human Chinese, AI Chinese, then English. If no subtitle track is exposed by Bilibili, Video Digest reports that no transcript is available; it does not create one from the media stream.

## SiliconFlow

If you do not have an account, use the [SiliconFlow signup link](https://cloud.siliconflow.cn/i/w3LDYnbF). Existing users can manage API keys from the link in extension Settings.

The AI endpoint is fixed to `https://api.siliconflow.cn/v1`. Settings loads text-chat model suggestions from:

```text
GET /v1/models?type=text&sub_type=chat
```

The default model ID is `deepseek-ai/DeepSeek-V4-Flash`. A valid model selected or entered by the user is retained instead of being replaced by the default. The selected model is used for overviews, explanations, non-Chinese-to-Chinese translation, and optional note cleanup. Chinese source captions bypass translation.

Overview generation uses SiliconFlow SSE streaming. For long Bilibili transcripts with many short cues, the extension first groups adjacent cues; if the result is still too large, it retains evenly spaced timestamped sections across the whole video while explicitly preserving the beginning and end. Bilibili overviews also use smaller reasoning and output budgets to reduce latency. Existing YouTube analysis budgets are unchanged. The side panel has a bounded watchdog so interrupted requests become retryable errors instead of remaining stuck.

Model availability, pricing, rate limits, and context limits vary. Review the current SiliconFlow console before selecting a model.

## Bilibili limitations

- Only subtitle tracks exposed by Bilibili are supported.
- Some AI subtitle tracks require a Bilibili login.
- Bilibili risk control may temporarily reject requests; open the video normally, wait, and retry.
- If player selectors change, the extension falls back to floating Digest and Note buttons.

## Local data

Settings, transcripts, translations, overviews, notes, and reading positions stay in the current browser profile. Use **Clear cached digests** or **Reset extension data** in Settings when needed. See [PRIVACY.md](PRIVACY.md) for the complete data flow.

## Development

The extension uses plain HTML, CSS, and JavaScript with no build step.

```bash
npm test
npm run check
npm run package
```

The package command validates the release allowlist, JavaScript syntax, tests, local references, and common credential patterns before creating a versioned ZIP in `dist/`.

## Attribution

Video Digest is based on [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest), created by Zara Zhang and used under the MIT License. This fork is independently maintained; issues about this version should be reported here rather than to the upstream project.

The Bilibili WBI signer, subtitle API flow, and hydration-safe page injection strategy are adapted from [biuworks/bilibili-digest](https://github.com/biuworks/bilibili-digest), also used under the MIT License.

The original and adapted copyright notices are preserved in [LICENSE](LICENSE), [NOTICE](NOTICE), and the relevant source files. This project remains licensed under the [MIT License](LICENSE).
