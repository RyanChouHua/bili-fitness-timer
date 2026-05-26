# Bilibili Fitness Timer

一个独立 Tampermonkey userscript，用 B 站视频片段辅助健身训练。

## 安装

安装地址：

```text
https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
```

在浏览器安装 Tampermonkey 后打开上面的地址即可安装。后续脚本更新会通过 userscript 的 `@updateURL` 从 GitHub raw 获取。

## 功能

- 在 B 站视频页注入轻量训练面板。
- 支持多行动作录入，例如：

```text
俯卧撑 00:12-00:28 3x8-12 rest45
深蹲 01:05-01:22 4x10 rest60
```

- 支持从当前视频时间填入开始/结束时间。
- 动作片段循环播放。
- 点击完成本组后进入休息倒计时。
- 倒计时结束播放 Web Audio 提示音，并进入下一组或下一动作。
- 支持选择从某个动作开始训练。
- 支持导入 / 导出当前视频训练计划 JSON。
- 计划按当前 B 站视频保存在 `localStorage`，同时保存已解析的动作时间戳列表。
- 桌面端面板更紧凑，可拖拽并保存位置。
- 安卓等移动端浏览器自动使用底部贴边布局，按钮按触控宽度排列。

## 开发

```bash
npm install
npm run typecheck
npm run build
```

构建产物：

```text
dist/bili-fitness-timer.user.js
```

把该文件拖入已安装 Tampermonkey 的浏览器，或在 Tampermonkey 中新建脚本后粘贴构建产物。

## 发布

```bash
npm run typecheck
npm run build
git add .
git commit -m "Release userscript"
git push
```

`dist/bili-fitness-timer.user.js` 会提交到仓库，用作 GitHub raw 安装和自动更新入口。
