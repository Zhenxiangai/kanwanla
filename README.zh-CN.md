# 看完啦

[中文](README.md) | [English](README.en.md)

<p align="center">
  <strong>把 YouTube 和 B 站长视频，变成可以读、可以搜、可以记的学习资料。</strong>
</p>

<p align="center">
  <a href="https://gitcode.com/gcw_XQNnjJtX/kanwanla/releases"><strong>国内下载最新版</strong></a>
  ·
  <a href="#3-分钟完成安装"><strong>安装教程</strong></a>
  ·
  <a href="#版本更新每次升级能得到什么"><strong>版本更新</strong></a>
  ·
  <a href="#常见问题"><strong>常见问题</strong></a>
  ·
  <a href="https://github.com/Zhenxiangai/kanwanla"><strong>GitHub 备用</strong></a>
</p>

> 完全不懂代码也可以使用。你只需要会下载 ZIP、打开浏览器扩展页面，并把自己的服务密钥粘贴到“设置”中。

## 它能帮你做什么

| 你想做的事 | “看完啦”会怎么帮你 |
| --- | --- |
| 看懂长视频 | 把字幕放到视频旁边，点击时间就能跳回对应画面。 |
| 阅读外语视频 | 在原文、中文和双语对照之间切换。 |
| 快速抓重点 | 用 AI 生成章节、重点摘录和带时间戳的概览。 |
| 问清楚一句话 | 选中字幕后点击“解释”，还可以补充自己的问题。 |
| 记下有用内容 | 点击“记笔记”或按键盘上的 `N`，保存当前时间和字幕。 |
| 把学习内容交给 Agent | 一键复制学习记录，或下载 Markdown、JSON 文件。 |

这些内容默认保存在你自己的浏览器里。“看完啦”没有开发者服务器、账号系统、广告或分析统计，也不要求安装本地 AI 软件。

## 和参考项目相比，“看完啦”增加了什么

“看完啦”基于 [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest) 二次开发，B 站部分参考并改编自 [biuworks/bilibili-digest](https://github.com/biuworks/bilibili-digest)。下面只写公开 README 和当前代码能核对的区别。

| 你关心的功能 | 原始 YouTube 项目 | B 站参考项目 | 看完啦 |
| --- | --- | --- | --- |
| 支持的视频网站 | YouTube | B 站 | 一个扩展同时支持 YouTube 和 B 站。 |
| YouTube 没有原生字幕 | 不生成字幕 | 不适用 | 可由用户主动开启 Supadata AI 转写后备；默认仍优先原生字幕。 |
| AI 服务和模型 | 固定 DeepSeek V4 Flash | 填写自己的模型服务 | 默认使用硅基流动 DeepSeek V4 Flash，也可读取账号可用模型或手动更换。 |
| 中文和语言选择 | 原文、中文、双语内容视图 | 原文、译文、双语，自动判断翻译方向 | 新安装中文优先；界面语言、AI 输出语言和字幕显示方式可以分别选择。 |
| 遇到看不懂的一句话 | 选中文字后让 AI 解释 | 划词解释，并有整视频问答 | 选中文字后，不只解释，还能输入自己的具体疑问，让 AI 针对回答。 |
| 记笔记和带走内容 | 保存带时间戳笔记 | 可编辑、搜索并导出学习稿 | YouTube 与 B 站都可点击或按 `N` 保存；立即显示真实保存内容，并可复制给 Agent、下载 Markdown 或 JSON。 |
| 等待 AI 概览时 | 生成章节与重点 | 分块显示进度，可停止和补失败块 | 统一显示正在准备、等待模型、生成、整理等真实阶段和已用时间。 |
| 安装后的更新 | 从 GitHub 手动下载 | Chrome / Edge 商店自动更新 | 侧栏顶端直接检查；国内优先 GitCode，失败自动回退 GitHub。解压安装版仍需手动覆盖并重新加载。 |

简单说，“看完啦”最主要的增量不是把两个项目简单拼在一起，而是把双平台、可选模型、针对性提问、可靠笔记、Agent 学习记录和国内更新入口整理成同一套更容易上手的流程。

> 这不是优劣排名。B 站参考项目目前还提供整视频问答、可编辑笔记和浏览器商店自动更新等能力；“看完啦”当前更侧重双平台统一、中文小白体验和把学习结果交给 Agent。对比依据为 2026-09-01 的公开说明，后续可能变化。

## 版本更新：每次升级能得到什么

### 最新版 v2.2.0：统一叫“看完啦”

| 这次更新 | 对你的好处 |
| --- | --- |
| 扩展、仓库和安装包统一为“看完啦 / KanWanLa / kanwanla” | 名称和下载文件终于一致，不容易装错。 |
| 自动兼容旧版浏览器数据 | 原来保存的设置、笔记、划线问答和学习记录会继续保留。 |
| 首页开始记录每个版本的用户价值 | 更新前就能看懂新版解决了什么问题。 |
| 国内下载和 GitHub 备用地址同步换新 | 国内优先从 GitCode 下载，访问失败还有 GitHub。 |

以前几个版本也解决了很实际的问题：v2.1.3 增加国内下载，v2.1.2 把检查更新放到侧栏顶端，v2.1.1 修复笔记并加入划线提问、真实进度和 Agent 导出。

[查看完整版本更新记录](CHANGELOG.md) · [查看所有发行版](https://github.com/Zhenxiangai/kanwanla/releases)

## 看一眼实际效果

### B 站：边看视频，边读概览

<p align="center">
  <img src="docs/images/bilibili-overview.png" alt="B 站视频概览、章节、重点摘录与笔记功能" width="920"><br>
  <sub>在 B 站播放页直接生成带时间戳的章节和重点摘录，视频上的“记笔记”按钮也会保留。</sub>
</p>

### YouTube：字幕、概览和笔记都在同一个侧边栏

<table>
  <tr>
    <td width="33%" align="center" valign="top">
      <strong>字幕与中文翻译</strong><br><br>
      <img src="docs/images/youtube-transcript-zh.png" alt="YouTube 时间轴字幕与中文翻译" width="280"><br>
      <sub>逐句时间戳、原文/中文/双语切换，并可跟随视频播放。</sub>
    </td>
    <td width="33%" align="center" valign="top">
      <strong>AI 概览与处理进度</strong><br><br>
      <img src="docs/images/youtube-overview-progress.png" alt="YouTube AI 概览与生成进度" width="280"><br>
      <sub>生成章节和重点时，会显示当前阶段、已用时间和处理活动。</sub>
    </td>
    <td width="33%" align="center" valign="top">
      <strong>笔记与 Agent 导出</strong><br><br>
      <img src="docs/images/youtube-notes-agent-export.png" alt="YouTube 笔记管理与 Agent 导出" width="280"><br>
      <sub>统一管理笔记，并复制给 Agent 或下载 Markdown、JSON。</sub>
    </td>
  </tr>
</table>

### 重点摘录和划线提问

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <strong>自动整理重点</strong><br><br>
      <img src="docs/images/youtube-key-highlights.png" alt="YouTube AI 重点摘录" width="300"><br>
      <sub>每条重点都有时间，可以跳回视频、复制文字或保存为笔记。</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <strong>针对选中文字继续追问</strong><br><br>
      <img src="docs/images/youtube-selection-explain.png" alt="YouTube 划线解释与自定义问题" width="300"><br>
      <sub>不只让 AI 解释原文，还可以输入自己的疑问，让回答更有针对性。</sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <strong>保存后马上看到结果</strong><br><br>
      <img src="docs/images/youtube-note-saved.png" alt="YouTube 笔记保存反馈" width="330"><br>
      <sub>弹窗会显示真正保存的内容和时间链接。</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <strong>选中文字直接操作</strong><br><br>
      <img src="docs/images/youtube-selection-actions.png" alt="YouTube 字幕选区解释与笔记操作" width="330"><br>
      <sub>选中字幕后，直接点击“解释”或“笔记”。</sub>
    </td>
  </tr>
</table>

## 3 分钟完成安装

目前使用的是“手动安装版”。第一次操作多几步，后面就可以一直使用。

1. 国内用户先打开 [GitCode 发行版](https://gitcode.com/gcw_XQNnjJtX/kanwanla/releases)；如果无法访问，再打开 [GitHub 最新版](https://github.com/Zhenxiangai/kanwanla/releases/latest)。
2. 在发行版页面下载名称类似 `kanwanla-v版本号.zip` 的文件。
3. 找到下载好的 ZIP，双击或右键解压。请把解压后的文件夹放在一个长期不移动的位置。
4. 打开浏览器扩展页面：
   - Chrome：在地址栏输入 `chrome://extensions`
   - Edge：在地址栏输入 `edge://extensions`
5. 打开右上角或左侧的**开发者模式**。
6. 点击**加载已解压的扩展程序**，选择刚才解压的文件夹。正确的文件夹里面能看到 `manifest.json`。
7. 回到已经打开的 YouTube 或 B 站视频页面，刷新一次。

如果扩展卡片的名称不是“看完啦”，或版本号低于本页最新版，说明选到了旧文件夹。请重新选择包含 `manifest.json` 的新版文件夹。

### 不想自己操作？复制这段给 Agent

点击下面代码块右上角的复制按钮，把整段内容发送给 Codex、Hermes 或其他能够操作电脑的 Agent：

```text
请协助我在这台电脑上安装“看完啦”浏览器扩展。

官方项目：
- GitHub：https://github.com/Zhenxiangai/kanwanla
- 国内镜像：https://gitcode.com/gcw_XQNnjJtX/kanwanla
- 最新版：https://github.com/Zhenxiangai/kanwanla/releases/latest

请按下面的顺序执行：
1. 先确认这台电脑使用的操作系统，以及我要安装到 Chrome 还是 Edge；优先使用我当前正在使用的浏览器。
2. 检查现有扩展和下载目录，再开始修改。保留其他扩展和文件，不覆盖无关内容。
3. 只从上面的官方项目下载最新发行版 ZIP。国内镜像有可用发行版时优先使用；否则使用 GitHub 最新发行版。
4. 解压到一个长期保留、不会被系统自动清理的独立文件夹，并确认该文件夹里有 manifest.json。
5. 打开 chrome://extensions 或 edge://extensions，开启开发者模式，选择“加载已解压的扩展程序”。如果这一步必须由我点击，请一次只告诉我一个简短操作，等我完成后再继续。
6. 核对扩展卡片名称为“看完啦”，并记录显示的版本号。不要删除、停用或重新配置其他扩展。
7. 打开一个正常的 YouTube 或 B 站视频页面并刷新，确认“摘要”或“记笔记”入口出现，侧边栏可以打开。
8. 安装完成后，再引导我进入“设置”页面。API 密钥由我亲自填写；不要读取、复制、记录或代填任何 API 密钥。

不要安装无关软件、本地服务或其他浏览器扩展。遇到失败时先说明具体原因，再给出最小的修复步骤。只有“看完啦”扩展已加载，并且至少一个支持的视频页面能打开侧边栏，才算安装完成。
```

## 第一次使用：设置自己的服务

### API 密钥是什么

可以把 API 密钥理解成你自己的“服务通行证”。它不是本项目提供的，也不要发给别人。请只把密钥粘贴到扩展的“设置”页面。

| 想使用的功能 | 需要准备什么 |
| --- | --- |
| 保存笔记 | 什么都不用，直接使用。 |
| 读取 B 站字幕 | 不需要 API 密钥；少数字幕需要先在同一个浏览器中登录 B 站。 |
| 生成概览、翻译或解释 | 需要自己的硅基流动 API 密钥。 |
| 读取 YouTube 字幕 | 需要自己的 Supadata API 密钥。 |

1. 没有硅基流动账号：点击[注册硅基流动](https://cloud.siliconflow.cn/i/w3LDYnbF)，创建密钥后粘贴到设置页。
2. 没有 Supadata 账号：点击[注册 Supadata](https://supadata.ai/?ref=xiang)，创建密钥后粘贴到设置页。
3. AI 模型看不懂时，不用修改。默认的 `deepseek-ai/DeepSeek-V4-Flash` 可以直接使用，也可以以后再换。
4. 点击**保存设置**，回到视频页面刷新一次。

<p align="center">
  <img src="docs/images/settings-ai-services.png" alt="字幕服务、硅基流动 API 与 AI 模型设置" width="720"><br>
  <sub>设置页已经把 YouTube 字幕、B 站字幕和 AI 服务分开说明。</sub>
</p>

## 平时怎么用

1. 打开一个 YouTube 或 B 站视频。
2. 点击视频附近的**摘要**按钮，或打开浏览器侧边栏中的“看完啦”。
3. 在侧边栏上方选择：
   - **字幕**：阅读、搜索、翻译和跳转时间。
   - **概览**：生成章节和重点摘录。
   - **笔记**：查看已保存内容，并导出本次学习记录。
4. 想记下当前内容时，点击**记笔记**，或直接按键盘上的 `N`。
5. 想问 AI 时，先选中一段字幕，再点击**解释**。

## 把学习记录交给 Agent

打开**笔记 → 本次学习记录**，可以：

- 点击**复制给 Agent**，得到一段可以直接粘贴给 Hermes、Codex 或其他 Agent 的提示词。
- 点击**下载 Markdown**，保存成普通笔记文件。
- 点击**下载 JSON**，交给其他程序继续处理。
- 根据需要勾选**包含完整字幕**。默认不包含完整字幕，文件会更小，也更注意隐私。

<p align="center">
  <img src="docs/images/settings-agent-customization.png" alt="可编辑并复制给 Agent 的扩展开发提示词" width="760"><br>
  <sub>设置页还提供一段可编辑的开发提示词，方便让 Agent 在清楚安全边界的前提下继续修改项目。</sub>
</p>

## 如何更新

1. 在“看完啦”侧栏顶部点击**检查更新**。
2. 如果出现**新版本 vX**，点击它会打开最新发行版页面。
3. 下载新的 ZIP 并解压。
4. 把新文件复制到原来的扩展文件夹中，选择覆盖同名文件。
5. 回到 `chrome://extensions` 或 `edge://extensions`，在“看完啦”卡片上点击**重新加载**。
6. 刷新视频页面。

浏览器不允许手动安装的扩展自己覆盖本地文件，所以现在还不能做到真正的一键安装更新。顶部按钮负责提醒并带你打开正确的下载页。

## 常见问题

### YouTube 提示“未找到字幕”

这个视频可能没有原生字幕。打开“设置”，把“没有原生字幕时”改为使用 Supadata AI 转写后备，然后重试。AI 转写通常更慢，并可能按视频时长消耗 Supadata 额度。

### B 站提示没有字幕

先确认你已经在同一个浏览器中登录 B 站，然后刷新视频。有些视频本身没有提供字幕，这种情况插件也无法读取。

### 翻译或概览为什么比较慢

速度会受到视频长度、字幕数量、当前网络和所选模型影响。侧边栏会显示正在准备、等待模型或生成内容。完全没有变化时，可以点击重试。

### 我不会选择 AI 模型

保持默认的 DeepSeek V4 Flash 即可。模型列表是给有特殊需要的用户准备的。

### “摘要”或“记笔记”按钮没有出现

先刷新视频页面。如果仍未出现，请到浏览器扩展页面，在“看完啦”卡片上点击**重新加载**，再回到视频页面刷新。

### API 密钥会上传到项目作者那里吗

不会。密钥保存在当前浏览器个人资料中，只在使用对应功能时发送给 Supadata 或硅基流动。不要把密钥写进源码、截图、聊天、日志或 GitHub 提交。

### 只看 B 站，需要 Supadata 吗

不需要。Supadata 只负责 YouTube 字幕。B 站字幕直接来自 B 站。

## 支持范围

- Chrome 或 Edge 116 及更高版本。
- YouTube 普通视频播放页。
- B 站 `/video/` 和 `/list/` 播放页，包括多 P 视频。
- B 站只读取平台提供的字幕轨，不会从视频声音中重新生成字幕。
- YouTube 可选择 Supadata 的 AI 转写后备，但需要用户主动开启。

## 数据和隐私

- 设置、字幕缓存、翻译、概览、笔记、划线问答和阅读位置都保存在当前浏览器个人资料中。
- 项目没有开发者后端、账号系统、广告或分析统计。
- 完整字幕不会自动复制给 Agent，必须由你明确勾选。
- 更新检查只读取 GitCode 或 GitHub 上公开的版本号和发行说明；不会发送视频、字幕、笔记或 API 密钥。
- 需要清除数据时，可在设置页使用**清除缓存的摘要**或**重置扩展数据**。

更完整的数据说明请看 [PRIVACY.md](PRIVACY.md)，安全问题请看 [SECURITY.md](SECURITY.md)。

<details>
<summary><strong>给开发者：技术实现与本地验证</strong></summary>

### 字幕来源

- YouTube：把规范化视频链接发送到 Supadata。默认只读取已有字幕；用户明确开启后，才使用 AI 转写后备。
- Bilibili：通过 `api.bilibili.com/x/web-interface/view` 获取视频信息，通过 `api.bilibili.com/x/player/wbi/v2` 获取字幕列表，再从 `hdslb.com` 下载字幕 JSON。

### AI 服务

- 接口：`https://api.siliconflow.cn/v1`
- 默认模型：`deepseek-ai/DeepSeek-V4-Flash`
- 用户仍可加载账号可用模型，或手动填写模型 ID。

### 本地开发

项目使用原生 HTML、CSS 和 JavaScript，不需要构建前端，也不需要本地服务。

```bash
npm test
npm run check
npm run package
```

打包后会生成 `dist/kanwanla-v<版本>.zip`。提交改动前请同时检查 Chrome、Edge、YouTube 和 B 站。

</details>

<details>
<summary><strong>开源来源与授权</strong></summary>

“看完啦”由 [Zhenxiangai/kanwanla](https://github.com/Zhenxiangai/kanwanla) 独立维护，基于 Zara Zhang 的 [zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest) 二次开发，并依据 MIT License 使用和发布。

B 站字幕接入与按钮注入方案参考并改编自 [biuworks/bilibili-digest](https://github.com/biuworks/bilibili-digest)，同样依据 MIT License 使用。

原项目及改编代码的版权声明保留在 [LICENSE](LICENSE)、[NOTICE](NOTICE) 和对应源文件中。欢迎阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 后参与改进。

</details>
