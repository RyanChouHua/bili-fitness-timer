import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright-core'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scriptPath = resolve(repoRoot, 'dist/bili-fitness-timer.user.js')
const screenshotPath = resolve(repoRoot, 'pic/tablet-training-controls.png')

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\A_Program\\portable_apps\\Browse\\Chrome\\App\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

const executablePaths = [...new Set(chromeCandidates)].filter(candidate => existsSync(candidate))

if (executablePaths.length === 0) {
  throw new Error('No browser executable found. Set CHROME_PATH to chrome.exe or msedge.exe.')
}

const script = await readFile(scriptPath, 'utf8')
await mkdir(dirname(screenshotPath), { recursive: true })

let browser = null
let launchError = null
let selectedExecutablePath = ''
const failedExecutablePaths = []
for (const executablePath of executablePaths) {
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
    })
    selectedExecutablePath = executablePath
    break
  } catch (error) {
    launchError = error
    failedExecutablePaths.push(executablePath)
  }
}

if (!browser) {
  throw launchError ?? new Error('Failed to launch browser.')
}

if (failedExecutablePaths.length > 0) {
  console.log(`skipped incompatible browser: ${failedExecutablePaths.join(', ')}`)
}
console.log(`using ${selectedExecutablePath}`)

try {
  const page = await browser.newPage({
    viewport: {
      width: 820,
      height: 1180,
    },
  })

  await page.route('https://www.bilibili.com/video/BV1xx411c7mD', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Mock Bilibili Workout Page</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: #12151a;
      color: #f7f8fb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .mock-video-wrap {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    video {
      width: min(100%, 760px);
      aspect-ratio: 16 / 9;
      background: linear-gradient(135deg, #222a33, #0f1216);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <main class="mock-video-wrap">
    <video controls muted></video>
  </main>
</body>
</html>`,
    })
  })

  await page.goto('https://www.bilibili.com/video/BV1xx411c7mD')
  await page.evaluate(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve()
    HTMLMediaElement.prototype.pause = () => {}
    localStorage.setItem(
      'bili-fitness-timer:BV1xx411c7mD',
      JSON.stringify({
        schemaVersion: 2,
        bvid: 'BV1xx411c7mD',
        activeGroupId: 'tablet-demo',
        groups: [
          {
            id: 'tablet-demo',
            rawInput: '俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60',
            settings: { beepDuration: 2, pauseDuringRest: true },
            savedExercises: [],
            bvid: 'BV1xx411c7mD',
            title: '平板触控布局演示',
            author: 'Bilibili Fitness Timer',
            notes: 'README screenshot demo',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }),
    )
    localStorage.setItem(
      'bili-fitness-timer:preferences',
      JSON.stringify({
        panelPosition: null,
        panelSize: null,
        previewLocked: true,
        activeTab: 'preview',
        inputCollapsed: true,
      }),
    )
  })

  await page.addScriptTag({ content: script })
  await page.getByRole('button', { name: '开始训练' }).click()
  await page
    .locator('#bili-fitness-timer-panel .bft-primary-training-button', {
      hasText: '完成本组',
    })
    .waitFor()
  await page.locator('#bili-fitness-timer-panel').screenshot({
    path: screenshotPath,
  })
  console.log(`saved ${screenshotPath}`)
} finally {
  await browser.close()
}
