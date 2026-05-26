# Bilibili Fitness Timer

一个独立 Tampermonkey userscript，用 B 站视频片段辅助健身训练。

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
- 计划按当前 B 站视频保存在 `localStorage`。

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
