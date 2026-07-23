import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const previewUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/preview/'
const screenshotDirectory = new URL('./screenshots/2r/', import.meta.url)
const views = ['training', 'workbench', 'dock']
const statuses = ['idle', 'exercise', 'rest', 'paused', 'complete']
const widths = [
  { id: 'mobile', width: 390, height: 844 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1280, height: 820 },
]

await mkdir(screenshotDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', (error) => consoleErrors.push(error.message))

const fileFor = (name) => fileURLToPath(new URL(name, screenshotDirectory))

async function select(view, status, width) {
  await page.setViewportSize({ width: width.width, height: width.height })
  await page.locator(`.preview-toolbar [data-view="${view}"]`).click()
  await page.locator(`.preview-toolbar [data-status="${status}"]`).click()
  await page.locator(`.preview-toolbar [data-width="${width.id}"]`).click()
  await page.waitForTimeout(160)
}

async function checkLayout(view, status, width) {
  const layout = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="preview-stage"]')
    const shell = document.querySelector('[data-testid="ui-shell"]')
    const training = document.querySelector('[data-testid="training-deck"]')
    const workbench = document.querySelector('[data-testid="plan-workbench"]')
    const panel = training ?? workbench
    const trainingPanel = document.querySelector('.training-deck__panel')
    const scrim = document.querySelector('.training-deck__scrim')
    const restOverlay = document.querySelector('.training-deck__rest-overlay')
    const drawer = document.querySelector('.plan-workbench__drawer')
    const veil = document.querySelector('.plan-workbench__veil')
    const video = document.querySelector('.mock-video-frame')
    const comments = document.querySelector('.mock-comments')
    const recommendations = document.querySelector('.mock-recommendations')
    const dock = document.querySelector('[data-testid="dock-bar"]')
    const stageRect = stage?.getBoundingClientRect()
    const shellRect = shell?.getBoundingClientRect()
    const panelRect = trainingPanel?.getBoundingClientRect() ?? drawer?.getBoundingClientRect()
    const videoRect = video?.getBoundingClientRect()
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stageOverflow: stage ? stage.scrollWidth - stage.clientWidth : -1,
      shellOverflow: shell ? shell.scrollWidth - shell.clientWidth : -1,
      shellClipped: shellRect && stageRect ? shellRect.left < stageRect.left - 1 || shellRect.right > stageRect.right + 1 : true,
      panelCount: panel ? 1 : 0,
      deckCount: document.querySelectorAll('[data-testid="training-deck"]').length,
      workbenchCount: document.querySelectorAll('[data-testid="plan-workbench"]').length,
      dockCount: document.querySelectorAll('[data-testid="dock-bar"]').length,
      dockZ: dock ? getComputedStyle(dock).zIndex : null,
      scrimZ: scrim ? getComputedStyle(scrim).zIndex : null,
      trainingPanelZ: trainingPanel ? getComputedStyle(trainingPanel).zIndex : null,
      trainingPanelBackground: trainingPanel ? getComputedStyle(trainingPanel).backgroundColor : null,
      veilZ: veil ? getComputedStyle(veil).zIndex : null,
      veilOpacity: veil ? getComputedStyle(veil).backgroundColor : null,
      drawerZ: drawer ? getComputedStyle(drawer).zIndex : null,
      videoZ: video ? getComputedStyle(video).zIndex : null,
      commentsZ: comments ? getComputedStyle(comments).zIndex : null,
      recommendationsDisplay: recommendations ? getComputedStyle(recommendations).display : null,
      videoBeforePanel: videoRect && panelRect ? videoRect.right <= panelRect.left + 2 : false,
      restOverlay: restOverlay ? { pointerEvents: getComputedStyle(restOverlay).pointerEvents, text: restOverlay.textContent?.trim() } : null,
      pausedMarker: (() => {
        const pill = document.querySelector('.training-deck--paused .status-pill')
        return pill ? getComputedStyle(pill).backgroundColor === 'rgb(184, 202, 238)' : false
      })(),
    }
  })

  assert.ok(layout.documentOverflow <= 1, `${width.id} document overflow: ${layout.documentOverflow}px`)
  assert.ok(layout.stageOverflow <= 1, `${width.id} stage overflow: ${layout.stageOverflow}px`)
  assert.ok(layout.shellOverflow <= 1, `${width.id} UI shell overflow: ${layout.shellOverflow}px`)
  assert.equal(layout.shellClipped, false, `${width.id} UI shell is clipped`)
  assert.equal(layout.deckCount, view === 'training' ? 1 : 0, `${view} training deck visibility`)
  assert.equal(layout.workbenchCount, view === 'workbench' ? 1 : 0, `${view} workbench visibility`)
  assert.equal(layout.dockCount, 1, 'dock bar should always be present')
  assert.equal(layout.dockZ, '10', 'dock bar z-index')

  if (view === 'training') {
    assert.equal(layout.scrimZ, '20', 'training scrim z-index')
    assert.equal(layout.videoZ, '45', 'mock video z-index')
    assert.equal(layout.commentsZ, '45', 'mock comments z-index')
    assert.equal(layout.trainingPanelZ, '60', 'training panel z-index')
    assert.notEqual(layout.trainingPanelBackground, 'rgb(255, 255, 255)', 'training panel should be dark')
    assert.equal(layout.recommendationsDisplay, 'none', 'training recommendations should be hidden by takeover')
    if (width.id !== 'mobile') assert.equal(layout.videoBeforePanel, true, 'training video should sit left of control column')
    assert.equal(Boolean(layout.restOverlay), status === 'rest', 'rest countdown overlay visibility')
    if (layout.restOverlay) assert.equal(layout.restOverlay.pointerEvents, 'none', 'rest overlay should not intercept video')
    assert.equal(layout.pausedMarker, status === 'paused', 'paused visual marker')
  }

  if (view === 'workbench') {
    assert.equal(layout.veilZ, '70', 'workbench veil z-index')
    assert.equal(layout.drawerZ, '80', 'workbench drawer z-index')
    assert.match(layout.veilOpacity ?? '', /rgba\(8, 15, 20, 0\.78\)/, 'workbench veil opacity')
  }

  if (width.id === 'mobile') {
    const shortButtons = await page.locator('[data-testid="ui-shell"] button').evaluateAll((buttons) => buttons
      .map((button) => ({ label: button.textContent?.trim() ?? '', height: button.getBoundingClientRect().height }))
      .filter((button) => button.height < 43.5))
    assert.deepEqual(shortButtons, [], `mobile buttons below 44px: ${JSON.stringify(shortButtons)}`)
  }
}

try {
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await page.locator('[data-testid="preview-stage"]').waitFor()

  for (const view of views) {
    for (const status of statuses) {
      for (const width of widths) {
        await select(view, status, width)
        await checkLayout(view, status, width)
        await page.screenshot({ path: fileFor(`${view}-${status}-${width.id}.png`), fullPage: true })
      }
    }
  }

  await page.locator('.preview-toolbar [data-view="workbench"]').click()
  await page.locator('.preview-toolbar [data-sample="input-error"]').click()
  await page.locator('[data-testid="plan-workbench"] [role="alert"]').waitFor()
  await page.screenshot({ path: fileFor('workbench-input-error.png'), fullPage: true })

  await page.locator('.preview-toolbar [data-sample="many-groups"]').click()
  await page.getByRole('button', { name: '下一页' }).click()
  await page.locator('[data-testid="plan-workbench"]').getByText('第 2 / 3 页').waitFor()
  await page.screenshot({ path: fileFor('workbench-groups-page-2.png'), fullPage: true })

  await page.locator('[data-testid="plan-workbench"] .drawer-scroll').evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.locator('[data-testid="plan-workbench"]').getByRole('heading', { name: '设置' }).waitFor()
  await page.screenshot({ path: fileFor('workbench-plan-data-settings.png'), fullPage: true })

  await page.locator('.preview-toolbar [data-view="training"]').click()
  await page.locator('.preview-toolbar [data-status="idle"]').click()
  await page.locator('.preview-toolbar [data-sample="empty"]').click()
  await page.locator('[data-testid="training-deck"]').getByText('还没有训练计划').waitFor()
  await page.screenshot({ path: fileFor('training-idle-empty.png'), fullPage: true })

  await page.locator('.preview-toolbar [data-status="exercise"]').click()
  await page.locator('.preview-toolbar [data-sample="reset-confirm"]').click()
  await page.locator('[data-testid="training-deck"]').getByText('确认重置训练？').waitFor()
  await page.locator('[data-testid="training-deck"] .training-deck__panel').evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.screenshot({ path: fileFor('training-reset-confirm.png'), fullPage: true })

  assert.deepEqual(consoleErrors, [], `browser console errors: ${JSON.stringify(consoleErrors)}`)
  console.log(`2R preview checks passed: ${views.length} views × ${statuses.length} statuses × ${widths.length} widths + boundary screenshots.`)
} finally {
  await browser.close()
}
