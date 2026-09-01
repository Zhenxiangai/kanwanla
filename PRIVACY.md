# Privacy

Last updated: September 1, 2026

看完啦 is a local, bring-your-own-key Chrome and Edge extension. It has no developer-operated backend, 看完啦 account, analytics, advertising, telemetry, or data-broker integration.

## Data handled

Depending on the site and feature, the extension handles:

- the active YouTube video ID or Bilibili BV number and part number;
- video title, creator or channel name, description, duration, and playback time;
- subtitle text, timestamps, detected language, and whether a Bilibili track is AI-generated;
- generated chapters, quotes, translations, explanations, optional questions about selected text, and timestamped notes;
- Supadata and SiliconFlow API keys, the YouTube no-caption handling preference, plus the selected SiliconFlow chat-model ID; and
- interface and AI-output language preferences, cache timestamps, transcript reading positions, and local learning-record revision metadata.

## Network requests

### Supadata

For YouTube only, 看完啦 sends the canonical YouTube watch URL to `https://api.supadata.ai` with the user-supplied Supadata API key. By default it requests native captions and receives subtitle text and timestamps. If the user explicitly enables the no-caption AI fallback, the request uses Supadata's automatic mode, which may generate a transcript from the video when native captions are unavailable. Generated transcription can take longer and consume Supadata credits according to video duration.

No Supadata request is made for Bilibili videos.

### Bilibili

For Bilibili videos, 看完啦 requests video metadata and subtitle-track metadata from `https://api.bilibili.com`. These requests use `credentials: include`, so Chrome may attach Bilibili cookies already present in the same browser profile. This allows Bilibili to return subtitle tracks available to the signed-in user.

The extension does not request Chrome's `cookies` permission. It does not enumerate, read, copy, log, or store cookie values itself.

The selected subtitle JSON is downloaded from a Bilibili-controlled `https://*.hdslb.com` URL with `credentials: omit`, so cookies are not attached to that request. Bilibili receives these requests under its own privacy policy and account settings.

### SiliconFlow

For AI features, 看完啦 sends relevant subtitle text and video context directly to `https://api.siliconflow.cn/v1`, authenticated with the user's SiliconFlow API key. The selected model may receive:

- video title, creator, description, and duration;
- timestamped transcript sections;
- text selected for explanation and the optional question entered by the user; and
- content selected for Chinese translation.

For a long Bilibili overview, adjacent short caption cues are grouped before transmission. If the grouped transcript still exceeds the input limit, the extension sends evenly spaced timestamped sections across the video and preserves the beginning and end instead of sending every cue.

When the user clicks **Load models**, Settings sends the SiliconFlow API key to `GET /v1/models?type=text&sub_type=chat`. That request does not contain a video URL, subtitle, or note.

The 看完啦 developer does not proxy or receive Supadata, Bilibili, or SiliconFlow requests.

Timestamped notes are assembled and saved locally from the available caption cues. Saving a note does not wait for or send that note to SiliconFlow.

### GitCode and GitHub release checks

When the side panel opens, 看完啦 may request public release metadata from `https://api.gitcode.com/api/v5/repos/gcw_XQNnjJtX/kanwanla/releases/latest`. If that request fails or returns invalid metadata, it falls back to `https://api.github.com/repos/Zhenxiangai/kanwanla/releases/latest`. A successful result is cached for 24 hours; a failed check is not retried for at least one hour. The response is reduced to the public version number, release title, short release notes, publication time, and a validated GitCode or GitHub release URL.

These requests do not contain Supadata or SiliconFlow API keys, video URLs, video identifiers, subtitles, notes, Bilibili cookies, or browser-account identifiers. GitCode or GitHub receives only the ordinary network metadata associated with an HTTPS request, such as the user's IP address and browser networking information, under that host's own privacy policy. Update-check failure does not block video features.

## Local storage

Chrome local extension storage contains:

- Supadata and SiliconFlow settings and API keys;
- the YouTube native-only or AI-fallback transcript preference;
- the selected SiliconFlow chat-model ID;
- cached transcripts, translations, overviews, and video metadata;
- saved notes and timestamped links;
- saved selection questions and AI answers;
- UI, output-language, and reading-position preferences;
- stable learning-record revision fingerprints; and
- public update metadata, the last check time, and a dismissed-version preference.

YouTube keeps its historical raw video ID as the cache key. Bilibili uses a key containing the BV number and part number.

Content scripts cannot read local extension storage because the background service worker restricts access to trusted extension contexts.

## Learning-record exports

The Notes tab can assemble the current source metadata, overview, key excerpts, saved notes, and selection Q&A into a copyable Agent prompt or downloadable Markdown/JSON file. This assembly happens locally in the extension. The complete transcript is excluded unless the user explicitly enables **Include full transcript**.

看完啦 does not automatically upload, sync, or send a learning record to Hermes or any other Agent. After copying or downloading, the user controls where that data goes. External tools that receive an exported record apply their own privacy and retention policies.

## Retention and deletion

Digest cache entries expire after 30 days, and the extension keeps at most 20 cached videos. Notes and saved selection Q&A are each capped at 100 entries. Notes can be deleted individually; saved selection Q&A and learning-record revision metadata are removed when all extension data is reset. Learning-record revision metadata is capped at 100 sources.

Settings provides controls to clear cached digests or reset all 看完啦 data. Uninstalling the extension also removes its Chrome extension storage. Clearing local data does not delete information already processed or retained by Supadata, Bilibili, or SiliconFlow.

## Permissions

- `sidePanel`: display the interface beside a supported video.
- `storage`: store settings, cache, preferences, and notes locally.
- `tabs`: identify and message the active supported-video tab.
- `scripting`: read canonical YouTube player metadata.
- YouTube host access: interact with the active YouTube page.
- Supadata host access: retrieve YouTube native captions and, only after explicit opt-in, request generated transcription when captions are unavailable.
- SiliconFlow host access: list models and perform configured AI requests.
- Bilibili host access: interact with Bilibili playback pages and retrieve metadata and subtitle tracks.
- `*.hdslb.com` host access: download the selected Bilibili subtitle JSON.
- GitCode API host access: check the preferred public release version and release notes.
- GitHub API host access: provide a release-check fallback when GitCode is unavailable.

看完啦 does not use these permissions to monitor unrelated browsing.

## Contact

Review the source and security guidance before installing a locally distributed build. Security concerns should follow [SECURITY.md](SECURITY.md).
