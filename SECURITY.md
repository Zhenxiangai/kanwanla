# Security policy

## Supported version

Security fixes apply to the latest code and latest packaged release. Older local snapshots are not supported.

## Secret handling

看完啦 is a bring-your-own-key extension. API keys belong only in the extension's Settings page, where Chrome stores them in local extension storage.

Do not put API keys, access tokens, cookies, or private transcripts in:

- source files or configuration examples;
- commits, issues, pull requests, or chat messages;
- screenshots, recordings, logs, or packaged ZIP files; or
- copied customization prompts or learning-record exports.

Revoke a key at its provider immediately if it may have been exposed.

The extension restricts `chrome.storage.local` access to trusted extension contexts. YouTube and Bilibili content scripts cannot read stored API keys or cached extension data. The SiliconFlow key stays inside trusted extension contexts and is never sent to a video page.

## Bilibili login state

Bilibili API requests use Chrome's normal credential handling, so Bilibili may attach cookies already present for the signed-in browser profile. 看完啦 does not request the Chrome `cookies` permission and does not read or persist cookie values. Subtitle CDN requests explicitly omit credentials.

## Network scope

Release builds should communicate only with the documented hosts:

- `www.youtube.com`;
- `api.supadata.ai`;
- `api.siliconflow.cn`;
- `www.bilibili.com`;
- `api.bilibili.com`; and
- Bilibili subtitle hosts under `*.hdslb.com`; and
- `api.gitcode.com` for the preferred public release metadata source; and
- `api.github.com` for public release metadata only.

Release metadata is treated as untrusted input: responses are size-bounded, versions and repository URLs are validated, notes are converted to bounded plain text, and the UI renders them with `textContent` rather than HTML.

Learning-record exports also treat video text, notes, and AI answers as untrusted study data. The Agent prompt wraps a bounded JSON record, escapes markup delimiters, and tells the receiving Agent not to execute instructions found inside the record. This reduces prompt-injection risk but does not replace reviewing sensitive content before sending it to another system. Full transcripts are excluded unless the user explicitly opts in.

Unexpected network destinations, credential exposure, permission expansion, unsafe HTML rendering, or a release ZIP containing private files should be treated as security issues.

## Release checks

The release script:

- packages only an explicit file allowlist;
- validates the manifest and local file references;
- checks JavaScript syntax;
- runs the Node test suite; and
- scans public files for common credential patterns.

These checks reduce mistakes but cannot prove that a build is safe. Review source changes and the final ZIP before distribution.

## Reporting

Do not disclose vulnerabilities, credentials, private video information, or transcript data in a public issue or pull request. Use GitHub's private vulnerability-reporting flow from this repository's Security tab. If that option is unavailable, contact the repository owner through their GitHub profile and request a private channel without including vulnerability details.

In the private report, describe the affected version, reproduction steps, expected impact, and suggested mitigation. Remove all keys, cookies, private subtitle text, account identifiers, and personal information.

## Third-party code

看完啦 is a derivative work of [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest), used under the MIT License. All required third-party copyright notices remain preserved in [LICENSE](LICENSE), [NOTICE](NOTICE), and the adapted source files.
