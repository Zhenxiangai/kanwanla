# 看完了

[中文](README.md) | [English](README.en.md)

> 视频太长？看完了帮你划重点。

**KanWanLe – AI Video Learning Assistant**

把 YouTube 和 B 站视频变成便于深入学习的资料：带时间戳字幕、双语阅读、硅基流动生成的章节与金句、选中文字解释和视频笔记，都集中在同一个 Chrome 或 Edge 侧边栏中。

“看完了”是本地运行、自备 API Key 的 Chromium 扩展。它没有开发者服务器、账号系统、分析统计、广告或附带的 API 额度。

> [!IMPORTANT]
> 本项目基于 [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest) 进行二次开发，并依据 MIT License 使用和发布。当前分支独立维护，完整保留原项目版权声明，并新增 B 站、硅基流动模型选择、Chrome 与 Edge 兼容及稳定性优化。

![看完了演示](YouTube%20Digest%20demo.png)

## 这个版本增加了什么

- 支持 B 站普通视频和多 P 视频，字幕来自 B 站官方网页接口。
- AI 服务改为硅基流动，默认使用 DeepSeek V4 Flash，也可读取账号可用模型或手动填写模型 ID。
- 在 Chrome 和 Edge 中支持 YouTube 与 B 站。
- 为 B 站长视频概览增加字幕碎片合并、受限输入、较小推理预算和可重试超时机制。
- 增加平台隔离的字幕缓存、中文字幕直出和多 P 独立数据。
- 增加中文更新提醒：显示版本号与主要改动，商店安装版可请求浏览器更新，GitHub 解压版会打开经过校验的最新版下载页。

## 支持的网站

- **YouTube：**普通视频播放页，原生字幕通过 Supadata 获取。
- **B 站：**`/video/` 和 `/list/` 播放页，包括多 P 视频；视频信息和字幕直接从 B 站官方网页接口读取。

升级后会继续使用原来的 YouTube 缓存和笔记标识。B 站每个分 P 使用独立的命名空间缓存键。

## 功能

- 在播放器旁阅读可点击跳转的字幕，并自动跟随播放位置。
- 点击字幕、章节、金句或笔记跳到对应时间。
- 随时切换原文、中文或对照双语视图。
- 原字幕是中文时直接显示，避免没有必要的“中译中”请求。
- 只有打开“概览”时才生成章节和金句。
- 解释选中的字幕内容并保存带时间戳笔记。
- 默认使用 DeepSeek V4 Flash；仍可从硅基流动加载账号可用模型，或手动填写其他模型 ID。
- 把字幕、翻译、分析、阅读位置和笔记保存在浏览器扩展的本地存储中。
- 完全在浏览器扩展内运行，不需要 Whisper、伴随应用、本地服务或开发者后端。

## 使用条件

- Chrome 或 Edge 116 或更高版本。
- 使用 AI 功能需要硅基流动 API Key；默认模型为 DeepSeek V4 Flash，也可自行更换。
- 获取 YouTube 字幕需要 Supadata API Key。
- 某些 B 站字幕只对登录用户可见，此时需在同一个浏览器个人资料中登录 B 站。

不要把 API Key 发到聊天中，也不要写进源码、截图、日志或提交记录。请只在扩展的“设置”页面中自行填写。

## 安装

1. 从 [GitHub 最新发行版](https://github.com/Zhenxiangai/kanwanle/releases/latest) 下载 ZIP，并解压到长期不移动的文件夹。
2. Chrome 打开 `chrome://extensions`；Edge 打开 `edge://extensions`。
3. 开启**开发者模式**，点击**加载已解压的扩展程序**。
4. 选择包含 `manifest.json` 的项目文件夹。
5. 打开“看完了”设置，填写自己的 API Key 并保存；可继续使用默认的 DeepSeek V4 Flash，也可加载其他硅基流动模型。
6. 刷新此前已经打开的 YouTube 或 B 站页面。

## 如何更新

- **Chrome Web Store / Edge Add-ons 安装版：**浏览器会按商店机制自动检查更新；“看完了”发现 GitHub 已发布新版本时，会显示版本号、主要改动和**立即更新**按钮。点击后会请求浏览器检查商店并在下载完成后应用。
- **GitHub 解压安装版：**浏览器不允许扩展安全覆盖自己的源码目录。点击同一个按钮会打开[最新发行版](https://github.com/Zhenxiangai/kanwanle/releases/latest)；解压并覆盖原文件后，在扩展管理页点击**重新加载**，再刷新视频页面。

版本检查最多每 24 小时自动请求一次 GitHub Releases API，只读取公开的版本号、发行说明和下载页地址，不会发送 API Key、视频地址、字幕、笔记或账号数据。网络失败不会影响字幕和摘要功能。

## 字幕来源

### YouTube

“看完了”会把规范化的 YouTube 视频链接发送到 Supadata 字幕接口，并固定使用 `mode=native`。它不会请求生成式转录。如果视频没有原生字幕轨，扩展会提示没有可用字幕。

### B 站

“看完了”依次执行：

1. 调用 `api.bilibili.com/x/web-interface/view`，把 BV 号和当前分 P 解析成 aid、cid。
2. 使用 B 站 WBI 签名调用 `api.bilibili.com/x/player/wbi/v2`，获取字幕轨列表。
3. 从 B 站的 `hdslb.com` 地址下载选中的字幕 JSON。

调用 B 站 API 时，浏览器可能附带当前个人资料中已有的 B 站 Cookie，以便列出登录用户可见的字幕轨。下载字幕文件时不会附带 Cookie。扩展不申请 Chrome 的 `cookies` 权限，也不会自行读取或保存 Cookie 内容。

字幕选择顺序为：人工中文、AI 中文、英文。如果 B 站没有提供字幕轨，“看完了”会提示没有可用字幕，不会从媒体流生成字幕。

## 硅基流动

没有账号时，可通过[硅基流动注册链接](https://cloud.siliconflow.cn/i/w3LDYnbF)创建账号；已有账号可直接在扩展设置页管理 API 密钥。

AI 接口固定为 `https://api.siliconflow.cn/v1`。“设置”页面通过下面的接口加载文本对话模型：

```text
GET /v1/models?type=text&sub_type=chat
```

默认模型 ID 为 `deepseek-ai/DeepSeek-V4-Flash`。用户从列表选择或手动填写的有效模型会被保留，不会被默认值覆盖。所选模型用于生成概览、解释、把非中文字幕翻译成中文，以及可选的笔记整理；中文字幕会跳过翻译。

概览生成使用硅基流动 SSE 流式输出。对于碎片较多的 B 站长字幕，扩展会先按短时间窗口合并相邻字幕；如果仍然过长，会均匀保留覆盖全片的时间片段，并明确保留首尾内容。B 站概览还使用更小的推理和输出预算，以减少等待时间。YouTube 的现有分析预算保持不变。侧边栏有超时看门狗，因此中断的请求会变成可重试错误，不会永久卡住。

模型可用性、价格、限流和上下文长度可能变化，请以当前硅基流动控制台为准。

## B 站限制

- 只支持 B 站接口提供的字幕轨。
- 某些 AI 字幕需要登录 B 站后才能读取。
- B 站风控可能临时拒绝请求，请正常打开视频、稍等片刻再重试。
- 如果播放器结构变化，扩展会退回到浮动的“摘要”和“笔记”按钮。

## 本地数据

设置、字幕、翻译、概览、笔记、阅读位置和更新检查时间都保存在当前浏览器个人资料中。需要时可在“设置”中使用**清除缓存的摘要**或**重置扩展数据**。完整数据流见 [PRIVACY.md](PRIVACY.md)。

## 开发与验证

本项目使用原生 HTML、CSS 和 JavaScript，不需要构建步骤。

```bash
npm test
npm run check
npm run package
```

打包命令会检查发布白名单、JavaScript 语法、测试、本地文件引用和常见密钥特征，再在 `dist/` 中生成 `kanwanle-v<版本>.zip`。

## 致谢与授权

“看完了”基于 Zara Zhang 创建的 [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest) 二次开发，并依据 MIT License 使用。当前项目由 [Zhenxiangai/kanwanle](https://github.com/Zhenxiangai/kanwanle) 独立维护；本版本的问题请提交到当前仓库，不要打扰上游项目。

B 站 WBI 签名、字幕接口流程和避免干扰页面 hydration 的按钮注入策略参考并改编自 [biuworks/bilibili-digest](https://github.com/biuworks/bilibili-digest)，同样依据 MIT License 使用。

原项目及改编代码的版权声明已保留在 [LICENSE](LICENSE)、[NOTICE](NOTICE) 和对应源文件中。本项目继续使用 [MIT License](LICENSE)。
