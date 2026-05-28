# Bilibili Fitness Timer

独立 Tampermonkey userscript，用 B 站视频片段辅助健身训练：录入动作时间戳后循环播放动作片段，完成一组后进入休息倒计时，倒计时结束播放提示音并继续下一组或下一个动作。

## 安装

GitHub raw 安装地址：

```text
https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/dist/bili-fitness-timer.user.js
```

浏览器安装 Tampermonkey 后打开上面的地址即可安装。后续脚本通过 `@updateURL` 从同一 GitHub raw 地址检查更新。

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
- 支持本地 JSON 导入/导出，保留当前 BV 视频分组下的全部子分组、标题、作者和备注。
- 支持按 BV 号在线导入 GitHub raw 时间戳文件。
- 计划按当前 BV 号保存到 `localStorage`；一个 BV 是一个视频分组，视频分组下可保存多个子分组，适合周一到周六等不同训练项目。
- 支持当前视频分组的子分组管理，可新建或复制子分组；子分组列表中可直接切换、修改或删除，并编辑标题、作者和备注。
- 训练控制区和时间戳录入固定在左列；右列通过分组、预览、设置切换，子分组列表支持分页和滚动。
- 时间戳录入区保持单行动作格式，长动作名可横向滚动查看。
- 桌面和平板悬浮面板支持拖动位置和右下角拖拽缩放，收起后只保留小标题栏。
- 动作预览支持锁定/解锁，解锁后训练中可直接切换动作。
- PC 使用紧凑悬浮面板，平板和手机浏览器有响应式布局。

## 在线时间戳

在线时间戳放在仓库的 `timestamps/` 目录，文件名必须是：

```text
timestamps/<BV号>.json
```

脚本会按当前视频 BV 号请求：

```text
https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/timestamps/<BV号>.json
```

示例格式见 [timestamps/BV1xx411c7mD.json](timestamps/BV1xx411c7mD.json)。

```json
{
  "bvid": "BV1TT4y1f7A3",
  "title": "Video workout group",
  "groups": [
    {
      "title": "周一动作",
      "rawInput": "俯卧撑 00:12-00:28 3x8-12 rest45"
    },
    {
      "title": "周二动作",
      "rawInput": "深蹲 01:05-01:22 4x10 rest60"
    }
  ]
}
```

每个 `groups[]` 条目就是该 BV 视频分组下的一个子分组，例如 `周一动作`、`周二动作`。子分组优先使用 `rawInput`；如果没有 `rawInput`，会从 `exercises` 生成录入文本。旧版单计划 JSON 仍兼容，会作为一个子分组导入。404、网络失败或 JSON 格式错误时，不覆盖本地已有数据。

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
