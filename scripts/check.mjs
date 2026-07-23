import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  booleanPreference,
  completeSet,
  createLibraryFromLegacy,
  extractBvidFromUrl,
  formatTimestamp,
  getPlanStorageKey,
  getTimestampLibraryUrl,
  defaultRuntimeStorageKey,
  isPlanStorageKey,
  moveToNextUnit,
  normalizeImportedPlanData,
  parsePlan,
  parseTimestamp,
  pauseRuntime,
  resetRuntime,
  resumeRuntime,
  serializeExercises,
  skipRest,
  startTraining,
  summarizeStoredPlan,
  switchToExercise,
  tickRest,
} from '../src/core/index.ts'
import {
  createWorkoutStore,
  isRuntimeSnapshotCompatible,
  readRuntimeSnapshot,
} from '../src/state/store.ts'

const readText = path => readFile(new URL(path, import.meta.url), 'utf8')
const bvid = 'BV1xx411c7mD'

const packageJson = JSON.parse(await readText('../package.json'))
assert.equal(packageJson.scripts.test, 'node scripts/check.mjs')

assert.equal(parseTimestamp('00:12'), 12)
assert.equal(parseTimestamp('1:05'), 65)
assert.equal(parseTimestamp('1:02:03'), 3723)
assert.equal(parseTimestamp('01:02.5'), 62.5)
assert.equal(parseTimestamp('1时'), 3600)
assert.equal(parseTimestamp('5分'), 300)
assert.equal(parseTimestamp('30秒'), 30)
assert.equal(parseTimestamp('1时5分30秒'), 3930)
assert.equal(parseTimestamp('5分30'), 330)
assert.equal(parseTimestamp('90秒'), 90)
assert.equal(parseTimestamp('not-a-time'), null)
assert.equal(formatTimestamp(65.9), '1:05')
assert.equal(formatTimestamp(3723), '1:02:03')

const parsed = parsePlan(
  ['Push Up 00:12-00:28 3x8-12 rest45', '深蹲 1时到1时5分 4组10 休息60'].join('\n'),
)
assert.deepEqual(parsed.errors, [])
assert.equal(parsed.exercises.length, 2)
assert.deepEqual(parsed.exercises[0], {
  id: '0-12-28',
  name: 'Push Up',
  start: 12,
  end: 28,
  sets: 3,
  minReps: 8,
  maxReps: 12,
  restSeconds: 45,
})
assert.equal(parsed.exercises[1]?.start, 3600)
assert.equal(parsed.exercises[1]?.end, 3900)
assert.equal(parsed.exercises[1]?.maxReps, 10)
assert.equal(parsePlan('00:12-00:28 1x5').exercises[0]?.name, '动作 1')
assert.equal(parsePlan('拉伸 00:12~00:28 1X5').exercises[0]?.restSeconds, 45)

const missingTime = parsePlan('Push Up 3x8')
assert.deepEqual(missingTime.exercises, [])
assert.match(missingTime.errors[0] ?? '', /缺少时间段/)
const missingSets = parsePlan('Push Up 00:12-00:28')
assert.match(missingSets.errors[0] ?? '', /缺少组数和次数/)
const reversedTime = parsePlan('Push Up 00:28-00:12 3x8')
assert.match(reversedTime.errors[0] ?? '', /结束时间必须晚于开始时间/)
const invalidCounts = parsePlan('Push Up 00:12-00:28 0x8')
assert.match(invalidCounts.errors[0] ?? '', /组数、次数或休息时间无效/)
const invalidRepRange = parsePlan('Push Up 00:12-00:28 3x12-8')
assert.match(invalidRepRange.errors[0] ?? '', /组数、次数或休息时间无效/)
const partialPlan = parsePlan('坏行\nSquat 01:05-01:22 4×10 rest60')
assert.equal(partialPlan.errors.length, 1)
assert.equal(partialPlan.exercises.length, 1)
assert.equal(partialPlan.exercises[0]?.id, '1-65-82')
assert.equal(
  serializeExercises(parsed.exercises),
  ['Push Up 0:12-0:28 3x8-12 rest45', '深蹲 1:00:00-1:05:00 4x10 rest60'].join('\n'),
)

assert.equal(extractBvidFromUrl(`https://www.bilibili.com/video/${bvid}`), bvid)
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/video/${bvid}?p=2`), bvid)
assert.equal(extractBvidFromUrl(`https://m.bilibili.com/video/${bvid}`), bvid)
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/list/123?bvid=${bvid}`), bvid)
assert.equal(extractBvidFromUrl(`https://www.bilibili.com/list/123?BV_ID=${bvid}`), bvid)
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

const timestampFile = JSON.parse(await readText('../timestamps/BV1xx411c7mD.json'))
const imported = normalizeImportedPlanData(timestampFile)
assert.equal(imported.bvid, bvid)
assert.equal(imported.title, 'Example workout timestamps')
assert.equal(imported.author, 'Bilibili Fitness Timer')
assert.equal(imported.notes, 'Example video group with multiple day subgroups.')
assert.equal(imported.groups.length, 2)
assert.equal(imported.groups[0]?.title, 'Monday workout')
assert.equal(imported.groups[1]?.title, 'Tuesday workout')
assert.deepEqual(parsePlan(imported.groups[1]?.rawInput ?? '').errors, [])

const legacyValue = {
  bvid,
  title: 'Legacy single plan',
  rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
  savedExercises: parsed.exercises.slice(0, 1),
  settings: { beepDuration: 3, pauseDuringRest: false },
  updatedAt: 12345,
}
const legacyImport = normalizeImportedPlanData(legacyValue)
assert.equal(legacyImport.groups.length, 1)
assert.equal(legacyImport.groups[0]?.title, 'Legacy single plan')
const legacyExercisesImport = normalizeImportedPlanData({
  title: 'Legacy exercises only',
  savedExercises: parsed.exercises.slice(0, 1),
})
assert.equal(legacyExercisesImport.exercises.length, 1)
assert.equal(legacyExercisesImport.rawInput, 'Push Up 0:12-0:28 3x8-12 rest45')
const legacyLibrary = createLibraryFromLegacy(legacyValue, 'Fallback title', bvid)
assert.equal(legacyLibrary.schemaVersion, 2)
assert.equal(legacyLibrary.activeGroupId, 'legacy-1')
assert.equal(legacyLibrary.groups.length, 1)
assert.equal(legacyLibrary.groups[0]?.title, 'Legacy single plan')
assert.deepEqual(legacyLibrary.groups[0]?.settings, {
  beepDuration: 3,
  pauseDuringRest: false,
})
assert.throws(() => normalizeImportedPlanData({ groups: [] }), /JSON 缺少子分组/)
assert.throws(
  () => normalizeImportedPlanData({ groups: [{ title: 'Empty' }] }),
  /第 1 个子分组：子分组缺少 rawInput 或 exercises/,
)

const summary = summarizeStoredPlan(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify(legacyValue),
)
assert.equal(summary?.storageId, bvid)
assert.equal(summary?.title, 'Legacy single plan')
assert.equal(summary?.groupId, null)
assert.equal(summary?.groupCount, 1)
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
assert.equal(
  summarizeStoredPlan(`bili-fitness-timer:${bvid}`, JSON.stringify({ groups: [] })),
  null,
)

const exercises = parsePlan(
  ['Push Up 00:12-00:28 2x8 rest2', 'Squat 01:05-01:22 1x10 rest0'].join('\n'),
).exercises
const started = startTraining(exercises, 0)
assert.deepEqual(started, {
  mode: 'exercise',
  exerciseIndex: 0,
  setIndex: 0,
  restRemaining: 0,
  beforePauseMode: 'exercise',
})
const resting = completeSet(exercises, started)
assert.equal(resting.mode, 'rest')
assert.equal(resting.restRemaining, 2)
assert.equal(started.mode, 'exercise')
assert.equal(tickRest(exercises, resting).restRemaining, 1)
const secondSet = tickRest(exercises, { ...resting, restRemaining: 1 })
assert.equal(secondSet.mode, 'exercise')
assert.equal(secondSet.setIndex, 1)
const nextExercise = skipRest(exercises, completeSet(exercises, secondSet))
assert.equal(nextExercise.exerciseIndex, 1)
assert.equal(nextExercise.setIndex, 0)
assert.equal(completeSet(exercises, nextExercise).mode, 'complete')
assert.equal(moveToNextUnit([], started).mode, 'complete')
assert.equal(startTraining([], 3).mode, 'idle')
assert.equal(startTraining(exercises, 99).exerciseIndex, 1)
const paused = pauseRuntime(resting)
assert.equal(paused.mode, 'paused')
assert.equal(paused.beforePauseMode, 'rest')
assert.equal(resumeRuntime(paused).mode, 'rest')
assert.deepEqual(resetRuntime(1), {
  mode: 'idle',
  exerciseIndex: 1,
  setIndex: 0,
  restRemaining: 0,
  beforePauseMode: 'idle',
})
assert.deepEqual(switchToExercise(exercises, paused, 1), {
  mode: 'paused',
  exerciseIndex: 1,
  setIndex: 0,
  restRemaining: 0,
  beforePauseMode: 'exercise',
})
assert.equal(switchToExercise(exercises, nextExercise, -1).exerciseIndex, 1)

assert.equal(isPlanStorageKey('bili-fitness-timer:session'), false)

const archivedV2Sample = {
  schemaVersion: 2,
  bvid,
  activeGroupId: 'tablet-demo',
  groups: [
    {
      id: 'tablet-demo',
      rawInput: '俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60',
      settings: { beepDuration: 2, pauseDuringRest: true },
      savedExercises: [],
      bvid,
      title: '平板触控布局演示',
      author: 'Bilibili Fitness Timer',
      notes: 'README screenshot demo',
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
  ],
  updatedAt: 1710000000000,
}

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, value) }
  removeItem(key) { this.values.delete(key) }
}

const archivedStorage = new MemoryStorage()
archivedStorage.setItem(`bili-fitness-timer:${bvid}`, JSON.stringify(archivedV2Sample))
let now = 1710000001000
let timerCallback = null
const beepCalls = []
const fakeVideo = {
  currentTime: 0,
  paused: true,
  listeners: new Map(),
  play() { this.paused = false; return Promise.resolve() },
  pause() { this.paused = true },
  addEventListener(type, listener) { this.listeners.set(type, listener) },
}
const archivedStore = createWorkoutStore({
  bvid,
  storage: archivedStorage,
  now: () => now++,
  setInterval: handler => { timerCallback = handler; return 7 },
  clearInterval: () => { timerCallback = null },
  beep: duration => { beepCalls.push(duration) },
})
assert.equal(archivedStore.getState().library.schemaVersion, 2)
assert.equal(archivedStore.getState().activeGroup.title, '平板触控布局演示')
assert.equal(archivedStore.getState().exercises.length, 2)
assert.equal(JSON.parse(archivedStorage.getItem(`bili-fitness-timer:${bvid}`)).schemaVersion, 2)
assert.equal(isPlanStorageKey(defaultRuntimeStorageKey), false)

archivedStore.attachVideo(fakeVideo)
archivedStore.actions.setPlanInput('动作一 00:12-00:13 2x1 rest1')
archivedStore.actions.startTraining()
assert.equal(archivedStore.getState().runtime.mode, 'exercise')
assert.equal(fakeVideo.currentTime, 12)
assert.equal(fakeVideo.paused, false)
archivedStore.actions.completeSet()
assert.equal(archivedStore.getState().runtime.mode, 'rest')
assert.equal(archivedStore.getState().runtime.setIndex, 0)
assert.equal(fakeVideo.paused, true)
assert.equal(beepCalls.length, 0)
timerCallback?.()
assert.equal(archivedStore.getState().runtime.mode, 'exercise')
assert.equal(archivedStore.getState().runtime.setIndex, 1)
assert.deepEqual(beepCalls, [2])
assert.deepEqual(readRuntimeSnapshot(archivedStorage)?.runtime, archivedStore.getState().runtime)
archivedStore.actions.completeSet()
archivedStore.actions.skipRest()
assert.deepEqual(beepCalls, [2])

archivedStore.actions.reset()
archivedStore.actions.setPlanInput([
  '动作一 00:12-00:13 1x1 rest0',
  '动作二 00:14-00:15 1x1 rest0',
].join('\n'))
archivedStore.actions.switchToExercise(1)
archivedStore.actions.startTraining()
assert.equal(archivedStore.getState().runtime.exerciseIndex, 1)
archivedStore.actions.completeSet()
assert.equal(archivedStore.getState().runtime.mode, 'complete')
archivedStore.actions.reset()
assert.equal(archivedStore.getState().runtime.mode, 'idle')
assert.equal(archivedStore.getState().runtime.exerciseIndex, 1)
archivedStore.dispose()

const featureStorage = new MemoryStorage()
const featurePlan = [
  '动作一 00:12-00:13 2x1 rest1',
  '动作二 00:14-00:15 1x1 rest1',
].join('\n')
featureStorage.setItem(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    schemaVersion: 2,
    bvid,
    activeGroupId: 'feature-group',
    groups: [{
      id: 'feature-group',
      rawInput: featurePlan,
      settings: { beepDuration: 2, pauseDuringRest: true },
      savedExercises: [],
      bvid,
      title: 'Wave 2 训练计划',
    }],
  }),
)
const featureVideo = {
  currentTime: 75,
  paused: true,
  listeners: new Map(),
  play() { this.paused = false; return Promise.resolve() },
  pause() { this.paused = true },
  addEventListener(type, listener) { this.listeners.set(`${type}-${this.listeners.size}`, listener) },
}
const featureStore = createWorkoutStore({ bvid, storage: featureStorage, runtimeStorageKey: 'bili-fitness-timer:feature-session' })
featureStore.attachVideo(featureVideo)
assert.equal(featureStore.getState().previewLocked, true)
featureStore.actions.startTraining()
featureStore.actions.switchToExercise(1)
assert.equal(featureStore.getState().runtime.exerciseIndex, 0)
assert.equal(featureStore.getState().lastAction, 'switch-exercise-blocked-preview-locked')
featureStore.future.setPreviewLocked(false)
assert.equal(featureStore.getState().previewLocked, false)
assert.equal(JSON.parse(featureStorage.getItem('bili-fitness-timer:preferences')).previewLocked, false)
featureStore.actions.switchToExercise(1)
assert.equal(featureStore.getState().runtime.exerciseIndex, 1)

featureStore.future.setPlanInfo({ title: '力量日', author: 'Ryan', notes: '保持动作稳定' })
assert.deepEqual(
  {
    title: featureStore.getState().activeGroup.title,
    author: featureStore.getState().activeGroup.author,
    notes: featureStore.getState().activeGroup.notes,
  },
  { title: '力量日', author: 'Ryan', notes: '保持动作稳定' },
)
const savedFeatureGroup = JSON.parse(featureStorage.getItem(`bili-fitness-timer:${bvid}`)).groups[0]
assert.equal(savedFeatureGroup.title, '力量日')
assert.equal(savedFeatureGroup.author, 'Ryan')
assert.equal(savedFeatureGroup.notes, '保持动作稳定')
featureStore.actions.reset()
featureStore.actions.setPlanInput('')
featureVideo.currentTime = 75
featureStore.future.insertTimestamp('start')
assert.equal(featureStore.getState().rawInput, '动作 1:15-')
featureVideo.currentTime = 90
featureStore.future.insertTimestamp('end')
assert.equal(featureStore.getState().rawInput, '动作 1:15-1:30 3x8-12 rest45')
assert.equal(featureStore.getState().exercises.length, 1)
featureStore.actions.setPlanInput(featurePlan)
featureStore.actions.startTraining(0)
featureStore.actions.completeSet()
assert.equal(featureStore.getState().runtime.mode, 'rest')
const featureSnapshot = readRuntimeSnapshot(featureStorage, 'bili-fitness-timer:feature-session')
assert.equal(isRuntimeSnapshotCompatible(featureSnapshot, featureStore.getState()), true)
featureStore.dispose()

const recoveryStore = createWorkoutStore({ bvid, storage: featureStorage, runtimeStorageKey: 'bili-fitness-timer:feature-session' })
const recoverySnapshot = recoveryStore.getState().runtimeSnapshot
assert.equal(isRuntimeSnapshotCompatible(recoverySnapshot, recoveryStore.getState()), true)
const recovered = recoveryStore.future.requestRuntimeRecovery()
assert.equal(recovered?.runtime.mode, 'rest')
assert.equal(recoveryStore.getState().runtime.mode, 'rest')
assert.equal(recoveryStore.getState().runtime.exerciseIndex, 0)
recoveryStore.dispose()

const declinedStore = createWorkoutStore({ bvid, storage: featureStorage, runtimeStorageKey: 'bili-fitness-timer:feature-session' })
assert.ok(declinedStore.getState().runtimeSnapshot)
declinedStore.actions.reset()
assert.equal(readRuntimeSnapshot(featureStorage, 'bili-fitness-timer:feature-session'), null)
declinedStore.dispose()

const mismatchStorage = new MemoryStorage()
for (const [key, value] of featureStorage.values) {
  mismatchStorage.setItem(key, value)
}
mismatchStorage.setItem('bili-fitness-timer:feature-session', JSON.stringify({
  schemaVersion: 1,
  bvid,
  storageId: bvid,
  activeGroupId: 'feature-group',
  planFingerprint: 'different-plan',
  runtime: { mode: 'exercise', exerciseIndex: 0, setIndex: 0, restRemaining: 0, beforePauseMode: 'exercise' },
  updatedAt: 1,
}))
const mismatchStore = createWorkoutStore({ bvid, storage: mismatchStorage, runtimeStorageKey: 'bili-fitness-timer:feature-session' })
assert.equal(mismatchStore.future.requestRuntimeRecovery(), null)
mismatchStore.dispose()

const legacyStorage = new MemoryStorage()
legacyStorage.setItem(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    bvid,
    title: 'Legacy single plan',
    rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
    savedExercises: parsed.exercises.slice(0, 1),
    settings: { beepDuration: 3, pauseDuringRest: false },
    updatedAt: 12345,
  }),
)
const legacyStore = createWorkoutStore({ bvid, storage: legacyStorage })
assert.equal(legacyStore.getState().library.schemaVersion, 2)
assert.equal(legacyStore.getState().library.activeGroupId, 'legacy-1')
assert.equal(legacyStore.getState().exercises[0]?.name, 'Push Up')
assert.equal(JSON.parse(legacyStorage.getItem(`bili-fitness-timer:${bvid}`)).groups.length, 1)
legacyStore.dispose()

const importedPlanPayload = {
  schemaVersion: 2,
  bvid,
  activeGroupId: 'import-group',
  groups: [
    {
      id: 'import-group',
      title: 'Imported plan',
      author: 'Import coach',
      notes: 'Imported notes',
      rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
      settings: { beepDuration: 3, pauseDuringRest: false },
      savedExercises: parsed.exercises.slice(0, 1),
    },
    {
      id: 'import-group-2',
      title: 'Imported plan 2',
      rawInput: 'Squat 01:05-01:22 4x10 rest60',
      settings: { beepDuration: 2, pauseDuringRest: true },
    },
  ],
}

const importedStorage = new MemoryStorage()
importedStorage.setItem(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    bvid,
    title: 'Before import',
    rawInput: 'Old 00:12-00:13 1x1',
  }),
)
const importedStore = createWorkoutStore({
  bvid,
  storage: importedStorage,
  importExport: { readJsonFile: async () => JSON.stringify(importedPlanPayload) },
})
await importedStore.future.importPlan()
assert.equal(importedStore.getState().library.schemaVersion, 2)
assert.equal(importedStore.getState().library.activeGroupId, 'import-group')
assert.equal(importedStore.getState().library.groups.length, 2)
assert.equal(importedStore.getState().activeGroup.title, 'Imported plan')
assert.deepEqual(
  JSON.parse(importedStorage.getItem(`bili-fitness-timer:${bvid}`)),
  JSON.parse(JSON.stringify(importedStore.getState().library)),
)
importedStore.dispose()

const legacyImportStorage = new MemoryStorage()
const legacyImportStore = createWorkoutStore({
  bvid,
  storage: legacyImportStorage,
  importExport: {
    readJsonFile: async () => JSON.stringify({
      bvid,
      title: 'Imported legacy plan',
      rawInput: 'Legacy push up 00:12-00:28 3x8-12 rest45',
      savedExercises: parsed.exercises.slice(0, 1),
      settings: { beepDuration: 3, pauseDuringRest: false },
    }),
  },
})
await legacyImportStore.future.importPlan()
assert.equal(legacyImportStore.getState().library.schemaVersion, 2)
assert.equal(legacyImportStore.getState().library.groups.length, 1)
assert.equal(legacyImportStore.getState().activeGroup.title, 'Imported legacy plan')
legacyImportStore.dispose()

const exportStorage = new MemoryStorage()
let exportedJson = null
let exportedFilename = null
const exportStore = createWorkoutStore({
  bvid,
  storage: exportStorage,
  importExport: {
    downloadJson: (filename, contents) => {
      exportedFilename = filename
      exportedJson = contents
    },
  },
})
exportStore.future.exportPlan()
const exportDate = new Date().toISOString().slice(0, 10)
assert.equal(exportedFilename, `bili-fitness-timer-${bvid}-${exportDate}.json`)
assert.equal(JSON.parse(exportedJson).schemaVersion, 2)
assert.deepEqual(JSON.parse(exportedJson), exportStore.getState().library)
exportStore.dispose()

const onlinePayload = {
  bvid,
  title: 'Online plan',
  author: 'Online coach',
  groups: [
    { title: 'Online day 1', rawInput: 'Squat 01:05-01:22 4x10 rest60' },
    { title: 'Online day 2', rawInput: 'Plank 01:30-01:45 2x1 rest45' },
  ],
}
const onlineStorage = new MemoryStorage()
let onlineUrl = null
const onlineStore = createWorkoutStore({
  bvid,
  storage: onlineStorage,
  importExport: {
    fetchJson: async url => {
      onlineUrl = url
      return { ok: true, status: 200, json: async () => onlinePayload }
    },
  },
})
await onlineStore.future.importOnlinePlan()
assert.equal(onlineUrl, getTimestampLibraryUrl(bvid))
assert.equal(onlineStore.getState().library.schemaVersion, 2)
assert.equal(onlineStore.getState().library.groups.length, 2)
assert.equal(onlineStore.getState().activeGroup.title, 'Online day 1')
assert.deepEqual(
  JSON.parse(onlineStorage.getItem(`bili-fitness-timer:${bvid}`)),
  JSON.parse(JSON.stringify(onlineStore.getState().library)),
)
onlineStore.dispose()

const failureSeed = {
  schemaVersion: 2,
  bvid,
  activeGroupId: 'local-group',
  groups: [{
    id: 'local-group',
    title: 'Local plan',
    rawInput: 'Local 00:12-00:28 2x8 rest45',
    savedExercises: parsed.exercises.slice(0, 1),
    settings: { beepDuration: 2, pauseDuringRest: true },
    bvid,
  }],
}
const assertOnlineFailurePreservesLocal = async (label, fetchJson) => {
  const storage = new MemoryStorage()
  storage.setItem(`bili-fitness-timer:${bvid}`, JSON.stringify(failureSeed))
  const store = createWorkoutStore({ bvid, storage, importExport: { fetchJson } })
  const beforeLibrary = JSON.stringify(store.getState().library)
  const beforeStorage = storage.getItem(`bili-fitness-timer:${bvid}`)
  await store.future.importOnlinePlan()
  assert.equal(JSON.stringify(store.getState().library), beforeLibrary, `${label}: library changed`)
  assert.equal(storage.getItem(`bili-fitness-timer:${bvid}`), beforeStorage, `${label}: storage changed`)
  store.dispose()
}

await assertOnlineFailurePreservesLocal(
  '404',
  async () => ({ ok: false, status: 404, json: async () => null }),
)
await assertOnlineFailurePreservesLocal(
  '500',
  async () => ({ ok: false, status: 500, json: async () => null }),
)
await assertOnlineFailurePreservesLocal(
  'invalid JSON',
  async () => ({ ok: true, status: 200, json: async () => JSON.parse('{invalid json') }),
)
await assertOnlineFailurePreservesLocal(
  'invalid shape',
  async () => ({ ok: true, status: 200, json: async () => ({ groups: [] }) }),
)
await assertOnlineFailurePreservesLocal(
  'mismatched BV',
  async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ...onlinePayload, bvid: 'BV1other1234' }),
  }),
)

let releaseFirstImport
let importReadCount = 0
const firstImportPending = new Promise(resolve => { releaseFirstImport = resolve })
const raceStorage = new MemoryStorage()
const raceStore = createWorkoutStore({
  bvid,
  storage: raceStorage,
  importExport: {
    readJsonFile: async () => {
      importReadCount += 1
      return importReadCount === 1
        ? firstImportPending
        : JSON.stringify({
            bvid,
            groups: [{ id: 'race-second', title: 'Second import', rawInput: 'Second 00:12-00:28 1x1' }],
          })
    },
  },
})
const firstImport = raceStore.future.importPlan()
const secondImport = raceStore.future.importPlan()
await secondImport
assert.equal(raceStore.getState().library.activeGroupId, 'race-second')
releaseFirstImport(JSON.stringify({
  bvid,
  groups: [{ id: 'race-first', title: 'First import', rawInput: 'First 00:12-00:28 1x1' }],
}))
await firstImport
assert.equal(raceStore.getState().library.activeGroupId, 'race-second')
assert.equal(JSON.parse(raceStorage.getItem(`bili-fitness-timer:${bvid}`)).activeGroupId, 'race-second')
raceStore.dispose()

const groupsStorage = new MemoryStorage()
groupsStorage.setItem(
  `bili-fitness-timer:${bvid}`,
  JSON.stringify({
    bvid,
    title: 'Legacy single plan',
    rawInput: 'Push Up 00:12-00:28 3x8-12 rest45',
    savedExercises: parsed.exercises.slice(0, 1),
    settings: { beepDuration: 3, pauseDuringRest: false },
    updatedAt: 12345,
  }),
)
const groupsStore = createWorkoutStore({
  bvid,
  storage: groupsStorage,
  runtimeStorageKey: 'bili-fitness-timer:test-groups-session',
})
const legacyGroupId = groupsStore.getState().activeGroupId
assert.equal(groupsStore.getState().library.schemaVersion, 2)
assert.equal(groupsStore.getState().exercises.length, 1)

groupsStore.future.duplicateActiveGroup()
const duplicateGroup = groupsStore.getState().activeGroup
assert.equal(groupsStore.getState().library.groups.length, 2)
assert.match(duplicateGroup.title ?? '', /副本/)
assert.equal(duplicateGroup.rawInput, 'Push Up 00:12-00:28 3x8-12 rest45')
assert.equal(duplicateGroup.savedExercises.length, 1)
const duplicateGroupId = duplicateGroup.id

groupsStore.future.createGroup()
const emptyGroupId = groupsStore.getState().activeGroupId
assert.equal(groupsStore.getState().library.groups.length, 3)
assert.equal(groupsStore.getState().activeGroup.rawInput, '')
assert.equal(groupsStore.getState().exercises.length, 0)

groupsStore.future.switchGroup(legacyGroupId)
assert.equal(groupsStore.getState().activeGroupId, legacyGroupId)
assert.equal(groupsStore.getState().activeGroup.title, 'Legacy single plan')
assert.equal(groupsStore.getState().exercises[0]?.name, 'Push Up')

groupsStore.future.renameGroup(legacyGroupId, '周一动作')
assert.equal(groupsStore.getState().activeGroup.title, '周一动作')
assert.equal(JSON.parse(groupsStorage.getItem(`bili-fitness-timer:${bvid}`)).groups.find(group => group.id === legacyGroupId).title, '周一动作')
groupsStore.future.renameGroup(legacyGroupId, '   ')
assert.equal(groupsStore.getState().activeGroup.title, '周一动作')

groupsStore.future.deleteGroup(duplicateGroupId)
assert.equal(groupsStore.getState().library.groups.length, 2)
assert.equal(groupsStore.getState().activeGroupId, legacyGroupId)
groupsStore.future.deleteGroup(legacyGroupId)
assert.equal(groupsStore.getState().library.groups.length, 1)
assert.equal(groupsStore.getState().activeGroupId, emptyGroupId)
groupsStore.future.deleteGroup(emptyGroupId)
assert.equal(groupsStore.getState().library.groups.length, 1)
assert.equal(JSON.parse(groupsStorage.getItem(`bili-fitness-timer:${bvid}`)).schemaVersion, 2)
groupsStore.dispose()

console.log('check passed')
