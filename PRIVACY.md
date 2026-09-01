# Privacy

Last updated: August 31, 2026

Video Digest is a local, bring-your-own-key Chrome and Edge extension. It has no developer-operated backend, Video Digest account, analytics, advertising, telemetry, or data-broker integration.

## Data handled

Depending on the site and feature, the extension handles:

- the active YouTube video ID or Bilibili BV number and part number;
- video title, creator or channel name, description, duration, and playback time;
- subtitle text, timestamps, detected language, and whether a Bilibili track is AI-generated;
- generated chapters, quotes, translations, explanations, and timestamped notes;
- Supadata and SiliconFlow API keys plus the selected SiliconFlow chat-model ID; and
- local UI preferences, cache timestamps, and transcript reading positions.

## Network requests

### Supadata

For YouTube only, Video Digest sends the canonical YouTube watch URL to `https://api.supadata.ai` with the user-supplied Supadata API key. It requests native captions and receives subtitle text and timestamps.

No Supadata request is made for Bilibili videos.

### Bilibili

For Bilibili videos, Video Digest requests video metadata and subtitle-track metadata from `https://api.bilibili.com`. These requests use `credentials: include`, so Chrome may attach Bilibili cookies already present in the same browser profile. This allows Bilibili to return subtitle tracks available to the signed-in user.

The extension does not request Chrome's `cookies` permission. It does not enumerate, read, copy, log, or store cookie values itself.

The selected subtitle JSON is downloaded from a Bilibili-controlled `https://*.hdslb.com` URL with `credentials: omit`, so cookies are not attached to that request. Bilibili receives these requests under its own privacy policy and account settings.

### SiliconFlow

For AI features, Video Digest sends relevant subtitle text and video context directly to `https://api.siliconflow.cn/v1`, authenticated with the user's SiliconFlow API key. The selected model may receive:

- video title, creator, description, and duration;
- timestamped transcript sections;
- text selected for explanation;
- note context; and
- content selected for Chinese translation.

For a long Bilibili overview, adjacent short caption cues are grouped before transmission. If the grouped transcript still exceeds the input limit, the extension sends evenly spaced timestamped sections across the video and preserves the beginning and end instead of sending every cue.

When the user clicks **Load models**, Settings sends the SiliconFlow API key to `GET /v1/models?type=text&sub_type=chat`. That request does not contain a video URL, subtitle, or note.

The Video Digest developer does not proxy or receive Supadata, Bilibili, or SiliconFlow requests.

## Local storage

Chrome local extension storage contains:

- Supadata and SiliconFlow settings and API keys;
- the selected SiliconFlow chat-model ID;
- cached transcripts, translations, overviews, and video metadata;
- saved notes and timestamped links; and
- UI and reading-position preferences.

YouTube keeps its historical raw video ID as the cache key. Bilibili uses a key containing the BV number and part number.

Content scripts cannot read local extension storage because the background service worker restricts access to trusted extension contexts.

## Retention and deletion

Digest cache entries expire after 30 days, and the extension keeps at most 20 cached videos. Notes remain until individually deleted or until all local data is cleared.

Settings provides controls to clear cached digests or reset all Video Digest data. Uninstalling the extension also removes its Chrome extension storage. Clearing local data does not delete information already processed or retained by Supadata, Bilibili, or SiliconFlow.

## Permissions

- `sidePanel`: display the interface beside a supported video.
- `storage`: store settings, cache, preferences, and notes locally.
- `tabs`: identify and message the active supported-video tab.
- `scripting`: read canonical YouTube player metadata.
- YouTube host access: interact with the active YouTube page.
- Supadata host access: retrieve YouTube native captions.
- SiliconFlow host access: list models and perform configured AI requests.
- Bilibili host access: interact with Bilibili playback pages and retrieve metadata and subtitle tracks.
- `*.hdslb.com` host access: download the selected Bilibili subtitle JSON.

Video Digest does not use these permissions to monitor unrelated browsing.

## Contact

Review the source and security guidance before installing a locally distributed build. Security concerns should follow [SECURITY.md](SECURITY.md).
