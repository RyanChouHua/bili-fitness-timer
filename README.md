# Bilibili Fitness Timer

独立 Tampermonkey userscript，用 B 站视频片段辅助健身训练：录入动作时间戳后循环播放动作片段，完成一组后进入休息倒计时，倒计时结束播放提示音并继续下一组或下一个动作。

## 安装

GitHub raw 安装地址：

```text
https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
```

浏览器安装 Tampermonkey 后打开上面的地址即可安装。后续脚本通过 `@updateURL` 从同一 raw 地址检查更新。

## 功能

- 支持 `www.bilibili.com`、`m.bilibili.com`、`bilibili.com` 下包含 BV 号且存在 `video` 元素的播放页面。
- 非视频页面不会注入训练面板。
- 支持多行录入，例如：

```text
俯卧撑 00:12-00:28 3x8-12 rest45
深蹲 01:05-01:22 4x10 rest60
```

- 支持从当前视频时间插入开始/结束时间。
- 动作片段循环播放；点击“完成本组”后进入休息倒计时。
- “完成本组”是独立大按钮，训练中更适合触控。
- 休息结束播放 Web Audio 提示音，支持 `1s / 2s / 3s / 5s`。
- 支持选择从某个动作开始训练。
- 支持本地 JSON 导入/导出，保留计划标题、作者和备注。
- 支持按 BV 号在线导入 GitHub raw 时间戳文件。
- 计划按当前 BV 号保存到 `localStorage`，同一个视频可保存多个训练分组，适合多天不同训练项目。
- 支持本地分组管理，可新建、复制、选择或删除当前视频下的训练分组，并编辑标题、作者和备注。
- 数据录入区、数据管理区、动作预览区可独立折叠；训练控制区常驻可用。
- 动作预览支持锁定/解锁，解锁后训练中可直接切换动作。
- PC 使用紧凑悬浮面板，平板和手机浏览器有响应式布局。

## 在线时间戳

在线时间戳放在仓库的 `timestamps/` 目录，文件名必须是：

```text
timestamps/<BV号>.json
```

脚本会按当前视频 BV 号请求：

```text
https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps/<BV号>.json
```

示例格式见 [timestamps/BV1xx411c7mD.json](timestamps/BV1xx411c7mD.json)。

```json
{
  "bvid": "BV1xx411c7mD",
  "title": "Example workout timestamps",
  "author": "Bilibili Fitness Timer",
  "notes": "Example local and online workout timestamp plan.",
  "rawInput": "Push Up 00:12-00:28 3x8-12 rest45",
  "exercises": [
    {
      "name": "Push Up",
      "start": 12,
      "end": 28,
      "sets": 3,
      "minReps": 8,
      "maxReps": 12,
      "restSeconds": 45
    }
  ]
}
```

脚本优先使用 `rawInput`；如果没有 `rawInput`，会从 `exercises` 生成录入文本。404、网络失败或 JSON 格式错误时，不覆盖本地已有数据。

## 开发

```bash
npm install
npm run test
npm run typecheck
npm run build
```

构建产物：

```text
dist/bili-fitness-timer.user.js
```

`dist/bili-fitness-timer.user.js` 需要提交到 Git，因为它是 GitHub raw 安装和 Tampermonkey 自动更新入口。

## 发布

```bash
npm run test
npm run typecheck
npm run build
git add .
git commit -m "Release userscript"
git push
```
