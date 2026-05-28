import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  booleanPreference,
  extractBvidFromUrl,
  getPlanStorageKey,
  getTimestampLibraryUrl,
  isPlanStorageKey,
  normalizeImportedPlanData,
  parsePlan,
  summarizeStoredPlan,
} from '../src/core.ts'

const readText = path => readFile(new URL(path, import.meta.url), 'utf8')

const packageJson = JSON.parse(await readText('../package.json'))
assert.equal(packageJson.scripts.test, 'node scripts/check.mjs')

const rawBaseUrl = 'https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main'
const viteConfig = await readText('../vite.config.ts')
assert.match(viteConfig, /fileName: 'bili-fitness-timer\.meta\.js'/)
assert.match(viteConfig, new RegExp(`@downloadURL\\s+\\$\\{rawBaseUrl\\}/dist/bili-fitness-timer\\.user\\.js`))
assert.match(viteConfig, new RegExp(`@updateURL\\s+\\$\\{rawBaseUrl\\}/dist/bili-fitness-timer\\.meta\\.js`))
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
  `https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/timestamps/${bvid}.json`,
)
assert.equal(getPlanStorageKey(bvid), `bili-fitness-timer:${bvid}`)
assert.equal(isPlanStorageKey(`bili-fitness-timer:${bvid}`), true)
assert.equal(isPlanStorageKey('bili-fitness-timer:preferences'), false)
assert.equal(isPlanStorageKey('other:key'), false)
assert.equal(booleanPreference(true, false), true)
assert.equal(booleanPreference(undefined, true), true)

const parsed = parsePlan('Push Up 00:12-00:28 3x8-12 rest45')
assert.deepEqual(parsed.errors, [])
assert.equal(parsed.exercises[0]?.start, 12)
assert.equal(parsed.exercises[0]?.end, 28)
assert.equal(parsed.exercises[0]?.sets, 3)

const timestampFile = JSON.parse(await readText('../timestamps/BV1xx411c7mD.json'))
const imported = normalizeImportedPlanData(timestampFile)
assert.equal(imported.bvid, bvid)
assert.equal(imported.title, 'Example workout timestamps')
assert.equal(imported.author, 'Bilibili Fitness Timer')
assert.equal(imported.notes, 'Example video group with multiple day subgroups.')
assert.equal(imported.exercises.length > 0 || imported.rawInput.length > 0, true)
assert.deepEqual(parsePlan(imported.rawInput).errors, [])
assert.equal(imported.groups.length, 2)
assert.equal(imported.groups[0]?.title, 'Monday workout')
assert.equal(imported.groups[1]?.title, 'Tuesday workout')
assert.deepEqual(parsePlan(imported.groups[1]?.rawInput ?? '').errors, [])

const legacyImport = normalizeImportedPlanData({
  bvid,
  title: 'Legacy single plan',
  rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
})
assert.equal(legacyImport.groups.length, 1)
assert.equal(legacyImport.groups[0]?.title, 'Legacy single plan')

const summary = summarizeStoredPlan(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    bvid,
    title: 'Saved sample',
    author: 'Sample author',
    notes: 'Sample notes',
    rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
    savedExercises: parsed.exercises,
    updatedAt: 12345,
  }),
)
assert.equal(summary?.storageId, bvid)
assert.equal(summary?.title, 'Saved sample')
assert.equal(summary?.groupId, null)
assert.equal(summary?.groupCount, 1)
assert.equal(summary?.author, 'Sample author')
assert.equal(summary?.notes, 'Sample notes')
assert.equal(summary?.actionCount, 1)
assert.equal(summary?.updatedAt, 12345)
const groupedSummary = summarizeStoredPlan(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    bvid,
    activeGroupId: 'day-2',
    groups: [
      {
        id: 'day-1',
        title: 'Day 1',
        rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
        savedExercises: parsed.exercises,
        updatedAt: 111,
      },
      {
        id: 'day-2',
        title: 'Day 2',
        author: 'Coach',
        notes: 'Upper body day',
        rawInput: 'Squat 01:05-01:22 4x10 rest60',
        updatedAt: 222,
      },
    ],
    updatedAt: 333,
  }),
)
assert.equal(groupedSummary?.groupId, 'day-2')
assert.equal(groupedSummary?.groupCount, 2)
assert.equal(groupedSummary?.title, 'Day 2')
assert.equal(groupedSummary?.author, 'Coach')
assert.equal(groupedSummary?.notes, 'Upper body day')
assert.equal(groupedSummary?.actionCount, 1)
assert.equal(groupedSummary?.updatedAt, 222)
assert.equal(summarizeStoredPlan(`bili-fitness-timer:${bvid}`, '{bad json'), null)

console.log('check passed')
