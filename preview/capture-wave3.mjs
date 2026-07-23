import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

// Wave 3 新 UI 专项截图：全局进度 / 断点恢复 / 计划信息 / 分组入口 / 导入导出 / 预览锁定
// 走 integration 真 store 页，通过真实交互驱动状态，而非 mock-data 硬编码。
const baseUrl = process.env.PREVIEW_URL ?? 'http://localhost:4180'
const pageUrl = `${baseUrl}/preview/integration.html`
const outDir = new URL('./screenshots/wave3/', import.meta.url)
await mkdir(outDir, { recursive: true })

const fileFor = (name) => fileURLToPath(new URL(name, outDir))
const shots = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push(e.message))

async function shot(name, note) {
  const path = fileFor(`${name}.png`)
  await page.screenshot({ path, fullPage: false })
  shots.push({ name, note })
}

// 元素截图：直接 clip 到该 section 包围盒，绕开滚动 clamp 导致的重复画面
async function shotElement(locator, name, note) {
  await locator.scrollIntoViewIfNeeded()
  await page.waitForTimeout(120)
  const path = fileFor(`${name}.png`)
  await locator.screenshot({ path })
  shots.push({ name, note })
}

async function gotoFresh() {
  await page.goto(pageUrl, { waitUntil: 'networkidle' })
  await page.locator('#integration-root').waitFor()
  await page.waitForTimeout(200)
}

try {
  // 清一次持久化，保证从干净态起
  await gotoFresh()
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await gotoFresh()

  // 1) 训练舱 — 开始训练后的全局进度条（exercise 态）
  //    integration 计划：深蹲 2组 / 俯卧撑 1组，共 2 个动作
  await page.getByRole('button', { name: /开始训练|开始/ }).first().click()
  await page.locator('[data-testid="training-progress"]').waitFor()
  await page.waitForTimeout(200)
  await shot('01-training-progress', '训练舱 · 全局进度条（第 1/2 动作，已完成 0）')

  // 2) 完成第一组后进度推进（进入 rest / 或推进动作）
  await page.getByRole('button', { name: /完成本组|完成/ }).first().click()
  await page.waitForTimeout(300)
  await shot('02-after-complete-set', '完成本组后 · 进度/休息态')

  // 3) 断点恢复 — 训练进行中直接刷新，应弹恢复对话框
  await gotoFresh()
  const recovery = page.locator('[data-testid="runtime-recovery"]')
  if (await recovery.count()) {
    await recovery.waitFor()
    await shot('03-runtime-recovery', '断点续练 · 刷新后弹出恢复对话框')
    // 点“继续上次训练”验证接续
    await page.getByRole('button', { name: '继续上次训练' }).click()
    await page.waitForTimeout(300)
    await shot('04-recovery-resumed', '断点续练 · 接受后接续训练态')
  } else {
    await shot('03-runtime-recovery-absent', '（未弹恢复框，需排查）')
  }

  // 4) 打开工作台 — 计划信息表单 + 导入导出入口 + 分组入口
  //    先重置回到可打开工作台的状态
  await gotoFresh()
  // 若又弹恢复框，先“不继续”清掉
  if (await page.locator('[data-testid="runtime-recovery"]').count()) {
    await page.getByRole('button', { name: '不继续' }).click()
    await page.waitForTimeout(200)
  }
  // 通过 DockBar 打开工作台
  const workbenchBtn = page.locator('[data-testid="dock-bar"]').getByRole('button', { name: /工作台|打开/ }).first()
  if (await workbenchBtn.count()) {
    await workbenchBtn.click()
    await page.locator('[data-testid="plan-workbench"]').waitFor()
    await page.waitForTimeout(250)
    await shot('05-workbench-top', '工作台 · 顶部（开始/录入区）')

    // 三个 workbench-section 靠 aria-labelledby 区分；用元素截图绕开滚动 clamp
    const groupList = page.locator('section[aria-labelledby="groups-title"]').first()
    if (await groupList.count()) {
      await shotElement(groupList, '06-group-list', '分组管理 · 新建/复制/改名/删除入口')
    }

    const planInfoSection = page.locator('section[aria-labelledby="plan-info-title"]').first()
    if (await planInfoSection.count()) {
      await shotElement(planInfoSection, '07-plan-info', '计划信息 · 标题/作者/备注表单')
    }

    const dataSection = page.locator('section[aria-labelledby="data-title"]').first()
    if (await dataSection.count()) {
      await shotElement(dataSection, '08-data-actions', '导入导出 · 本地/在线入口')
    }
  } else {
    await shot('05-workbench-open-failed', '（未找到工作台入口，需排查）')
  }

  console.log('Wave3 capture done. Console errors:', JSON.stringify(consoleErrors))
  console.log('SHOTS:' + JSON.stringify(shots))
} finally {
  await browser.close()
}
