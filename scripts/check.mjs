import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  extractBvidFromUrl,
  getTimestampLibraryUrl,
  normalizeImportedPlanData,
  parsePlan,
} from '../src/core.ts'

const readText = path => readFile(new URL(path, import.meta.url), 'utf8')

const packageJson = JSON.parse(await readText('../package.json'))
assert.equal(packageJson.scripts.test, 'node scripts/check.mjs')

const viteConfig = await readText('../vite.config.ts')
assert.match(viteConfig, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/RyanChouHua\/bili-fitness-timer\/main\/dist\/bili-fitness-timer\.user\.js/)
assert.match(viteConfig, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/RyanChouHua\/bili-fitness-timer\/main\/dist\/bili-fitness-timer\.user\.js/)
assert.match(viteConfig, /@match\s+https:\/\/www\.bilibili\.com\/\*/)
assert.match(viteConfig, /@match\s+https:\/\/m\.bilibili\.com\/\*/)

const bvid = 'BV1xx411c7mD'
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/video/${bvid}`), bvid)
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/video/${bvid}?p=2`), bvid)
assert.equal(extractBvidFromUrl(`https://m.bilibili.com/video/${bvid}`), bvid)
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/list/123?bvid=${bvid}`), bvid)
assert.equal(extractBvidFromUrl('https://www.bilibili.com/account/history'), null)
assert.equal(extractBvidFromUrl(`https://example.com/video/${bvid}`), null)
assert.equal(
  getTimestampLibraryUrl(bvid),
  `https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps/${bvid}.json`,
)

const parsed = parsePlan('Push Up 00:12-00:28 3x8-12 rest45')
assert.deepEqual(parsed.errors, [])
assert.equal(parsed.exercises[0]?.start, 12)
assert.equal(parsed.exercises[0]?.end, 28)
assert.equal(parsed.exercises[0]?.sets, 3)

const timestampFile = JSON.parse(await readText('../timestamps/BV1xx411c7mD.json'))
const imported = normalizeImportedPlanData(timestampFile)
assert.equal(imported.bvid, bvid)
assert.equal(imported.exercises.length > 0 || imported.rawInput.length > 0, true)
assert.deepEqual(parsePlan(imported.rawInput).errors, [])

console.log('check passed')
