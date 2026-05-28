# 项目 Agent 指令

## 项目定位

- 本项目是独立 Tampermonkey userscript：`Bilibili Fitness Timer`。
- 不改为 Bilibili-Evolved 插件，不引入后端服务。
- 需求来源以 `需求确认.md` 为准；`修改要求.md` 仅作为原始输入参考。
- 发布入口是 `dist/bili-fitness-timer.user.js`，用于 GitHub raw 安装和 Tampermonkey 自动更新。

## 当前核心需求

1. 响应式界面适配 PC、平板、手机浏览器。
   - 不实现 PC UA 修改、请求头伪装或引导开启桌面版网站。
   - PC 端保持紧凑悬浮面板，可拖拽。
   - 平板端避免按钮拥挤和文字溢出。
   - 手机端优先底部抽屉式布局，长内容可滚动，按钮适合触控。

2. 优化界面布局。
   - 数据录入区和动作预览区必须可独立折叠。
   - 训练控制区必须常驻可用，不能被录入区/预览区折叠影响。
   - 工具按钮按用途分组：时间插入、示例、导入/导出、在线导入、保存。
   - 动作预览列表保持高信息密度：名称、时间段、组数、次数、休息时间。

3. 脚本数据保存。
   - 按当前视频 BV 号或路径保存本地数据。
   - 保存 `rawInput` 和解析后的 `savedExercises`。
   - 需要明确保存状态或提供手动保存按钮。
   - 输入有错误时不能清空上一次有效动作列表。

4. GitHub 在线时间戳库。
   - 仓库目录使用 `timestamps/`。
   - 文件命名使用 `timestamps/<BV号>.json`。
   - 在线导入 URL：
     `https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps/<BV号>.json`
   - 脚本只按当前 BV 号请求对应文件。
   - 文件不存在、网络失败或 JSON 错误时，不能覆盖本地已有数据。

5. Bilibili 视频页识别必须可靠。
   - 当前单一匹配 `https://www.bilibili.com/video/*` 不足以覆盖所有可用视频入口。
   - 后续实现时应同时处理：
     - `https://www.bilibili.com/video/*`
     - `https://m.bilibili.com/video/*`
     - `https://www.bilibili.com/list/*` 中实际存在 BV 号的视频播放页
     - 带查询参数、分 P 参数、播放列表参数的 URL
   - 不应只依赖 `@match` 判断是否是视频页；脚本运行后还必须从 `location.href` 中提取 BV 号并确认页面存在 `video` 元素。
   - 推荐策略：
     - `@match` 可适当放宽到 Bilibili 相关域名。
     - 运行时使用 BV 号正则判断是否启用面板。
     - 无 BV 号或无 video 元素时不注入训练面板。

## 建议文件结构

```text
src/main.ts
dist/bili-fitness-timer.user.js
timestamps/
需求确认.md
修改要求.md
README.md
vite.config.ts
package.json
```

`dist/bili-fitness-timer.user.js` 需要保留在 Git 中，因为它是 GitHub raw 安装和更新入口。

## 时间戳 JSON 格式

```json
{
  "bvid": "BVxxxxxxxxxx",
  "title": "可选：视频标题或训练计划名称",
  "rawInput": "俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60",
  "exercises": [
    {
      "name": "俯卧撑",
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

实现在线导入时优先使用 `rawInput`；如果缺少 `rawInput`，再从 `exercises` 生成录入文本。

## 必要工具

- `rg`：优先用于搜索代码和文件。
- `npm`：安装依赖、类型检查、构建。
- `vite`：构建 userscript。
- `tsc`：类型检查。
- `git`：版本管理、提交、推送。
- Playwright：仅在需要真实浏览器验证响应式布局、交互、移动端视口时使用。
- GitHub raw：用于 userscript 更新和在线时间戳导入。
- 浏览器 URL 样本：用于验证 `@match` 和 BV 号提取逻辑。

## 验证命令

每次代码修改后至少运行：

```bash
npm run typecheck
npm run build
```

如 `npm run build` 在沙箱环境中因 Vite/esbuild 读取路径权限失败，应使用同一命令申请提升权限重跑，不要改构建逻辑绕过。

构建后确认：

```text
dist/bili-fitness-timer.user.js
```

文件头部必须包含：

```text
// ==UserScript==
// @downloadURL
// @updateURL
// ==/UserScript==
```

## 浏览器验证要求

涉及 UI 布局、折叠、移动端适配、在线导入时，应使用真实浏览器或 Playwright 验证：

- PC 宽屏：例如 `1366x768`
- 平板：例如 `820x1180` 和横屏
- 手机：例如 `390x844`

重点检查：

- 常见 Bilibili 视频 URL 能正确启用脚本，非视频页不注入面板。
- 面板不遮挡播放器关键控制。
- 录入区和动作预览区可独立折叠。
- 训练控制区常驻可操作。
- 按钮文字不溢出，不重叠。
- 手机端可滚动访问所有功能。
- 在线导入失败时本地数据不被覆盖。

## 开发约束

- 默认做最小必要修改。
- 不引入 UI 框架，除非需求明确要求。
- 不引入后端服务。
- 不移除 `localStorage` 本地保存能力。
- 不改动 GitHub raw 安装路径，除非仓库名或用户名确认变更。
- 修改 `@match` 后必须同步重建 `dist/bili-fitness-timer.user.js`。
- 发布前必须重建 `dist/bili-fitness-timer.user.js`。

## GitHub 发布注意

- 默认分支：`main`。
- 远端仓库预期：
  `https://github.com/RyanChouHua/bili-fitness-timer`
- userscript 安装地址：
  `https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js`
- 新版本发布时需要同步更新：
  - `package.json` 的 `version`
  - `vite.config.ts` 中 userscript metadata 的 `@version`
  - 重新运行 `npm run build`
  - 提交更新后的 `dist/bili-fitness-timer.user.js`
