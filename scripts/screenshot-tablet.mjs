import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const host = '127.0.0.1'
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const screenshotUrl = new URL('../preview/screenshots/width-tablet.png', import.meta.url)

async function reservePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, host, resolve)
  })
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return address.port
}

async function waitForPreview(url, processOutput) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error(`Preview server did not start at ${url}\n${processOutput()}`)
}

const externalPreviewUrl = process.env.PREVIEW_URL
const port = externalPreviewUrl ? null : await reservePort()
const previewUrl = externalPreviewUrl ?? `http://${host}:${port}/preview/`
let serverProcess = null
let serverOutput = ''

if (!externalPreviewUrl) {
  serverProcess = spawn(process.execPath, [viteBin, '--host', host, '--port', String(port), '--strictPort'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  serverProcess.stdout.on('data', chunk => { serverOutput += chunk })
  serverProcess.stderr.on('data', chunk => { serverOutput += chunk })
  await waitForPreview(previewUrl, () => serverOutput)
}

await mkdir(new URL('../preview/screenshots/', import.meta.url), { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 })
const browserErrors = []
page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()) })
page.on('pageerror', error => browserErrors.push(error.message))

try {
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await page.locator('[data-testid="preview-stage"]').waitFor()
  await page.locator('.preview-toolbar [data-view="training"]').click()
  await page.locator('.preview-toolbar [data-status="exercise"]').click()
  await page.locator('.preview-toolbar [data-width="tablet"]').click()
  await page.waitForTimeout(200)

  await page.screenshot({ path: fileURLToPath(screenshotUrl), fullPage: true })
  assert.deepEqual(browserErrors, [], `Browser errors: ${JSON.stringify(browserErrors)}`)
  console.log(`Tablet screenshot written to ${fileURLToPath(screenshotUrl)}`)
} finally {
  await browser.close()
  if (serverProcess && !serverProcess.killed) serverProcess.kill()
}
