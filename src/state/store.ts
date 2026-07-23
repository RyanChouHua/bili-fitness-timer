import {
  bindVideoLoopGuard,
  type VideoLoopSegmentProvider,
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
} from '../platform/bilibili.ts'
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
import { beep as defaultBeep } from '../platform/audio.ts'
import {
  completeSet,
  createLibraryFromLegacy,
  createIdleRuntime,
  formatTimestamp,
  normalizeBvid,
  normalizeImportedPlanData,
  normalizeStoredPlan,
  parsePlan,
  pauseRuntime,
  resetRuntime,
  resumeRuntime,
  startTraining,
  switchToExercise,
  tickRest,
  skipRest,
  type Exercise,
  type Runtime,
  type Settings,
  type StoredPlan,
  type StoredPlanLibrary,
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
} from '../core/index.ts'
import {
  booleanPreference,
  defaultPreferencesStorageKey,
  defaultRuntimeStorageKey,
  getPlanStorageKey,
  getTimestampLibraryUrl,
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
} from '../core/storage.ts'
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
import { defaultSettings } from '../core/model.ts'

export type DisplayMode = 'training' | 'workbench' | 'dock'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

export interface VideoLike {
  currentTime: number
  paused: boolean
  play(): Promise<unknown> | unknown
  pause(): void
  addEventListener(type: string, listener: EventListener): void
}

export interface RuntimeSnapshot {
  schemaVersion: 1
  bvid: string | null
  storageId: string
  activeGroupId: string
  planFingerprint: string
  runtime: Runtime
  updatedAt: number
}

export interface JsonResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface ImportExportOptions {
  readJsonFile?: () => Promise<string | null>
  downloadJson?: (filename: string, contents: string) => void
  fetchJson?: (url: string) => Promise<JsonResponseLike>
}

export interface FutureActions {
  createGroup(): void
  duplicateActiveGroup(): void
  switchGroup(groupId: string): void
  renameGroup(groupId: string, title: string): void
  deleteGroup(groupId: string): void
  importPlan(): void
  exportPlan(): void
  importOnlinePlan(): void
  setPlanInfo(info: Partial<Pick<StoredPlan, 'title' | 'author' | 'notes'>>): void
  insertTimestamp(kind: 'start' | 'end'): void
  setPreviewLocked(locked: boolean): void
  requestRuntimeRecovery(): RuntimeSnapshot | null
}

export interface StoreState {
  bvid: string | null
  storageId: string
  library: StoredPlanLibrary
  activeGroup: StoredPlan
  activeGroupId: string
  rawInput: string
  exercises: Exercise[]
  parseErrors: string[]
  settings: Settings
  runtime: Runtime
  selectedExerciseIndex: number
  previewLocked: boolean
  currentVideoTime: number
  runtimeSnapshot: RuntimeSnapshot | null
  view: DisplayMode
  resetConfirmation: boolean
  groupPage: number
  groupPageSize: number
  lastAction: string | null
}

export interface WorkoutStoreOptions {
  bvid?: string | null
  storageId?: string
  storage?: StorageLike | null
  runtimeStorageKey?: string
  now?: () => number
  setInterval?: (handler: () => void, timeoutMs: number) => number
  clearInterval?: (id: number) => void
  beep?: (durationSeconds: number) => void | Promise<void>
  importExport?: ImportExportOptions
}

export interface WorkoutStore {
  getState(): StoreState
  subscribe(listener: (state: StoreState) => void): () => void
  dispatch(action: StoreAction): void
  attachVideo(video: VideoLike): void
  dispose(): void
  actions: {
    startTraining(exerciseIndex?: number): void
    completeSet(): void
    tickRest(): void
    skipRest(): void
    pause(): void
    resume(): void
    reset(): void
    confirmReset(): void
    cancelReset(): void
    switchToExercise(exerciseIndex: number): void
    setPlanInput(rawInput: string): void
    setSettings(next: Partial<Settings>): void
    setView(view: DisplayMode): void
    setGroupPage(page: number): void
    [key: string]: (...args: never[]) => void
  }
  future: FutureActions
}

export type StoreAction =
  | { type: 'start-training'; exerciseIndex?: number }
  | { type: 'complete-set' }
  | { type: 'tick-rest' }
  | { type: 'skip-rest' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'reset' }
  | { type: 'confirm-reset' }
  | { type: 'cancel-reset' }
  | { type: 'switch-exercise'; exerciseIndex: number }
  | { type: 'set-plan-input'; rawInput: string }
  | { type: 'set-settings'; settings: Partial<Settings> }
  | { type: 'set-view'; view: DisplayMode }
  | { type: 'set-group-page'; page: number }
  | { type: 'future'; action: keyof FutureActions }

const runtimeModes = new Set<Runtime['mode']>([
  'idle',
  'exercise',
  'rest',
  'paused',
  'complete',
])

function getDefaultStorage(): StorageLike | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null
  }

  try {
    return globalThis.localStorage as StorageLike
  } catch {
    return null
  }
}

function getDefaultNow(): () => number {
  return () => Date.now()
}

function getDefaultStorageId(bvid: string | null, storageId?: string): string {
  if (storageId) {
    return storageId
  }

  if (bvid) {
    return bvid
  }

  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    return globalThis.location.pathname || 'local'
  }

  return 'local'
}

function getDefaultTitle(): string {
  if (typeof globalThis !== 'undefined' && 'document' in globalThis) {
    return globalThis.document.title || '子分组 1'
  }

  return '子分组 1'
}

function readPreviewLocked(storage: StorageLike | null): boolean {
  if (!storage) {
    return true
  }

  try {
    const parsed = JSON.parse(storage.getItem(defaultPreferencesStorageKey) ?? 'null') as {
      previewLocked?: unknown
    } | null
    return booleanPreference(parsed?.previewLocked, true)
  } catch {
    return true
  }
}

function readJsonFileFromPicker(): Promise<string | null> {
  if (typeof document === 'undefined' || !document.body) {
    return Promise.reject(new Error('当前环境不支持本地文件导入'))
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'

    const cleanup = (): void => {
      input.remove()
    }
    const finish = (result: string | null): void => {
      cleanup()
      resolve(result)
    }

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) {
        finish(null)
        return
      }

      void file
        .text()
        .then(finish)
        .catch(error => {
          cleanup()
          reject(error)
        })
    }, { once: true })
    input.addEventListener('cancel', () => finish(null), { once: true })
    input.style.display = 'none'
    document.body.append(input)
    input.click()
  })
}

function downloadJsonFile(filename: string, contents: string): void {
  if (typeof document === 'undefined' || !document.body || typeof Blob === 'undefined') {
    throw new Error('当前环境不支持 JSON 导出')
  }

  const urlApi = globalThis.URL
  if (!urlApi || typeof urlApi.createObjectURL !== 'function') {
    throw new Error('当前环境不支持 JSON 下载')
  }

  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' })
  const url = urlApi.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  globalThis.setTimeout(() => urlApi.revokeObjectURL(url), 0)
}

function getDefaultJsonFetcher(): ((url: string) => Promise<JsonResponseLike>) | undefined {
  if (typeof globalThis.fetch !== 'function') {
    return undefined
  }

  return url => globalThis.fetch(url, { cache: 'no-store' })
}

function importErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function createGroupId(): string {
  if (
    typeof globalThis !== 'undefined' &&
    'crypto' in globalThis &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `group-${globalThis.crypto.randomUUID()}`
  }

  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyGroup(
  bvid: string | null,
  title = '子分组 1',
  clock: () => number = Date.now,
): StoredPlan {
  const now = clock()
  return {
    id: createGroupId(),
    rawInput: '',
    settings: { ...defaultSettings },
    savedExercises: [],
    bvid,
    title,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeRuntime(value: unknown): Runtime | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<Runtime>
  if (
    !runtimeModes.has(candidate.mode as Runtime['mode']) ||
    (candidate.beforePauseMode as string | undefined) === 'paused' ||
    !runtimeModes.has(candidate.beforePauseMode as Runtime['mode']) ||
    !Number.isInteger(candidate.exerciseIndex) ||
    !Number.isInteger(candidate.setIndex) ||
    !Number.isFinite(candidate.restRemaining)
  ) {
    return null
  }

  return {
    mode: candidate.mode as Runtime['mode'],
    exerciseIndex: Math.max(0, candidate.exerciseIndex as number),
    setIndex: Math.max(0, candidate.setIndex as number),
    restRemaining: Math.max(0, candidate.restRemaining as number),
    beforePauseMode: candidate.beforePauseMode as Runtime['beforePauseMode'],
  }
}

function planFingerprint(exercises: Exercise[]): string {
  return JSON.stringify(
    exercises.map(({ id, name, start, end, sets, minReps, maxReps, restSeconds }) => ({
      id,
      name,
      start,
      end,
      sets,
      minReps,
      maxReps,
      restSeconds,
    })),
  )
}

function isRecoverableRuntime(runtime: Runtime): boolean {
  return runtime.mode !== 'idle' && runtime.mode !== 'complete'
}

export function isRuntimeSnapshotCompatible(
  snapshot: RuntimeSnapshot | null,
  expected: {
    bvid: string | null
    storageId: string
    activeGroupId: string
    exercises: Exercise[]
  },
): boolean {
  if (!snapshot || !isRecoverableRuntime(snapshot.runtime)) {
    return false
  }

  const exercise = expected.exercises[snapshot.runtime.exerciseIndex]
  if (!exercise) {
    return false
  }

  return (
    snapshot.bvid === expected.bvid &&
    snapshot.storageId === expected.storageId &&
    snapshot.activeGroupId === expected.activeGroupId &&
    snapshot.planFingerprint === planFingerprint(expected.exercises) &&
    snapshot.runtime.setIndex < exercise.sets
  )
}

export function readRuntimeSnapshot(
  storage: StorageLike | null,
  key = defaultRuntimeStorageKey,
): RuntimeSnapshot | null {
  if (!storage) {
    return null
  }

  try {
    const parsed = JSON.parse(storage.getItem(key) ?? 'null') as Partial<RuntimeSnapshot>
    const runtime = normalizeRuntime(parsed.runtime)
    if (
      parsed.schemaVersion !== 1 ||
      typeof parsed.storageId !== 'string' ||
      typeof parsed.activeGroupId !== 'string' ||
      typeof parsed.planFingerprint !== 'string' ||
      typeof parsed.updatedAt !== 'number' ||
      !Number.isFinite(parsed.updatedAt) ||
      !runtime
    ) {
      return null
    }

    return {
      schemaVersion: 1,
      bvid: typeof parsed.bvid === 'string' ? normalizeBvid(parsed.bvid) : null,
      storageId: parsed.storageId,
      activeGroupId: parsed.activeGroupId,
      planFingerprint: parsed.planFingerprint,
      runtime,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

function writeStorage(storage: StorageLike | null, key: string, value: unknown): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can be unavailable in private mode or when quota is exhausted.
  }
}

function readPlanLibrary(
  storage: StorageLike | null,
  storageKey: string,
  bvid: string | null,
  fallbackTitle: string,
  now: () => number,
): StoredPlanLibrary {
  const fallbackGroup = createEmptyGroup(bvid, fallbackTitle, now)
  const fallback: StoredPlanLibrary = {
    schemaVersion: 2,
    bvid,
    activeGroupId: fallbackGroup.id,
    groups: [fallbackGroup],
    updatedAt: now(),
  }

  if (!storage) {
    return fallback
  }

  try {
    const saved = storage.getItem(storageKey)
    if (!saved) {
      writeStorage(storage, storageKey, fallback)
      return fallback
    }

    const parsed = JSON.parse(saved) as { groups?: unknown; activeGroupId?: unknown; bvid?: unknown }
    if (!Array.isArray(parsed.groups)) {
      const migrated = createLibraryFromLegacy(parsed, fallbackTitle, bvid)
      writeStorage(storage, storageKey, migrated)
      return migrated
    }

    const groups = parsed.groups
      .map((group, index) => normalizeStoredPlan(group, `子分组 ${index + 1}`, index, bvid))
      .filter((group): group is StoredPlan => group !== null)
    if (groups.length === 0) {
      writeStorage(storage, storageKey, fallback)
      return fallback
    }

    const requestedActiveId = typeof parsed.activeGroupId === 'string' ? parsed.activeGroupId : null
    const activeGroupId =
      requestedActiveId && groups.some(group => group.id === requestedActiveId)
        ? requestedActiveId
        : groups[0].id
    const library: StoredPlanLibrary = {
      schemaVersion: 2,
      bvid: typeof parsed.bvid === 'string' ? normalizeBvid(parsed.bvid) ?? bvid : bvid,
      activeGroupId,
      groups,
      updatedAt: now(),
    }
    writeStorage(storage, storageKey, library)
    return library
  } catch {
    return fallback
  }
}

export function createWorkoutStore(options: WorkoutStoreOptions = {}): WorkoutStore {
  const bvid = options.bvid ? normalizeBvid(options.bvid) ?? options.bvid : null
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage
  const now = options.now ?? getDefaultNow()
  const storageId = getDefaultStorageId(bvid, options.storageId)
  const planKey = getPlanStorageKey(storageId)
  const runtimeKey = options.runtimeStorageKey ?? defaultRuntimeStorageKey
  const timerSet =
    options.setInterval ??
    ((handler, timeoutMs) =>
      globalThis.setInterval(handler, timeoutMs) as unknown as number)
  const timerClear =
    options.clearInterval ??
    (id => globalThis.clearInterval(id as unknown as ReturnType<typeof globalThis.setInterval>))
  const beep = options.beep ?? defaultBeep
  const readJsonFile = options.importExport?.readJsonFile ?? readJsonFileFromPicker
  const downloadJson = options.importExport?.downloadJson ?? downloadJsonFile
  const fetchJson = options.importExport?.fetchJson ?? getDefaultJsonFetcher()
  const listeners = new Set<(next: StoreState) => void>()
  let video: VideoLike | null = null
  let restTimerId: number | undefined
  let disposed = false
  let importOperation = 0

  const library = readPlanLibrary(storage, planKey, bvid, getDefaultTitle(), now)
  const activeGroup =
    library.groups.find(group => group.id === library.activeGroupId) ?? library.groups[0]
  if (!activeGroup) {
    throw new Error('计划库缺少 active group')
  }

  const parsed = parsePlan(activeGroup.rawInput)
  const exercises = activeGroup.savedExercises.length > 0 ? activeGroup.savedExercises : parsed.exercises
  let state: StoreState = {
    bvid,
    storageId,
    library,
    activeGroup,
    activeGroupId: activeGroup.id,
    rawInput: activeGroup.rawInput,
    exercises,
    parseErrors: parsed.errors,
    settings: { ...activeGroup.settings },
    runtime: createIdleRuntime(0),
    selectedExerciseIndex: 0,
    previewLocked: readPreviewLocked(storage),
    currentVideoTime: 0,
    runtimeSnapshot: readRuntimeSnapshot(storage, runtimeKey),
    view: exercises.length > 0 ? 'training' : 'workbench',
    resetConfirmation: false,
    groupPage: Math.floor(Math.max(0, library.groups.findIndex(group => group.id === activeGroup.id)) / 4) + 1,
    groupPageSize: 4,
    lastAction: null,
  }

  const publish = (): void => {
    if (disposed) {
      return
    }
    listeners.forEach(listener => listener(state))
  }

  const saveLibrary = (nextGroup: StoredPlan): void => {
    const updatedAt = now()
    const nextGroups = state.library.groups.map(group =>
      group.id === nextGroup.id ? nextGroup : group,
    )
    const nextLibrary: StoredPlanLibrary = {
      schemaVersion: 2,
      bvid,
      activeGroupId: nextGroup.id,
      groups: nextGroups,
      updatedAt,
    }
    state = {
      ...state,
      library: nextLibrary,
      activeGroup: nextGroup,
      activeGroupId: nextGroup.id,
    }
    writeStorage(storage, planKey, nextLibrary)
  }

  const groupPageFor = (groups: StoredPlan[], groupId: string): number => {
    const index = groups.findIndex(group => group.id === groupId)
    return Math.floor(Math.max(0, index) / state.groupPageSize) + 1
  }

  const persistLibrary = (nextLibrary: StoredPlanLibrary): void => {
    state = {
      ...state,
      library: nextLibrary,
      groupPage: groupPageFor(nextLibrary.groups, nextLibrary.activeGroupId),
    }
    writeStorage(storage, planKey, nextLibrary)
  }

  const uniqueGroupTitle = (baseTitle: string, groups: StoredPlan[]): string => {
    const existingTitles = new Set(groups.map(group => group.title?.trim()).filter(Boolean))
    const base = baseTitle.trim() || '子分组'
    if (!existingTitles.has(base)) {
      return base
    }

    let suffix = 2
    while (existingTitles.has(`${base} ${suffix}`)) {
      suffix += 1
    }
    return `${base} ${suffix}`
  }

  const activateGroup = (
    nextLibrary: StoredPlanLibrary,
    nextGroup: StoredPlan,
    actionLabel: string,
  ): void => {
    const parsed = parsePlan(nextGroup.rawInput)
    const nextExercises = nextGroup.savedExercises.length > 0 ? nextGroup.savedExercises : parsed.exercises
    state = {
      ...state,
      library: nextLibrary,
      activeGroup: nextGroup,
      activeGroupId: nextGroup.id,
      rawInput: nextGroup.rawInput,
      exercises: nextExercises,
      parseErrors: parsed.errors,
      settings: { ...nextGroup.settings },
      selectedExerciseIndex: 0,
      groupPage: groupPageFor(nextLibrary.groups, nextGroup.id),
      resetConfirmation: false,
    }
    writeStorage(storage, planKey, nextLibrary)
    transition(resetRuntime(0))
    recordAction(actionLabel)
  }

  const persistRuntime = (runtime: Runtime): RuntimeSnapshot => {
    const snapshot: RuntimeSnapshot = {
      schemaVersion: 1,
      bvid,
      storageId,
      activeGroupId: state.activeGroupId,
      planFingerprint: planFingerprint(state.exercises),
      runtime,
      updatedAt: now(),
    }
    writeStorage(storage, runtimeKey, snapshot)
    return snapshot
  }

  const clearRuntimeSnapshot = (): null => {
    try {
      storage?.removeItem?.(runtimeKey)
    } catch {
      // Storage can be unavailable in private mode or when quota is exhausted.
    }
    return null
  }

  const clearRestTimer = (): void => {
    if (restTimerId !== undefined) {
      timerClear(restTimerId)
      restTimerId = undefined
    }
  }

  const currentSegment: VideoLoopSegmentProvider = () => {
    if (state.runtime.mode !== 'exercise') {
      return null
    }
    const exercise = state.exercises[state.runtime.exerciseIndex]
    return exercise ? { start: exercise.start, end: exercise.end } : null
  }

  const seekAndPlay = (): void => {
    const exercise = state.exercises[state.runtime.exerciseIndex]
    if (!video || !exercise) {
      return
    }
    video.currentTime = exercise.start
    try {
      void Promise.resolve(video.play()).catch(() => undefined)
    } catch {
      // A browser may reject play() before a user gesture.
    }
  }

  const syncVideo = (previous: Runtime, next: Runtime, beepOnExit: boolean): void => {
    if (previous.mode === 'rest' && next.mode !== 'rest' && beepOnExit) {
      void Promise.resolve(beep(state.settings.beepDuration)).catch(() => undefined)
    }

    if (!video) {
      return
    }

    if (next.mode === 'rest' && state.settings.pauseDuringRest) {
      video.pause()
      return
    }

    if (next.mode === 'paused' || next.mode === 'idle' || next.mode === 'complete') {
      video.pause()
      return
    }

    if (
      next.mode === 'exercise' &&
      (previous.mode !== 'exercise' ||
        previous.exerciseIndex !== next.exerciseIndex ||
        previous.setIndex !== next.setIndex)
    ) {
      seekAndPlay()
    }
  }

  const syncRestTimer = (): void => {
    if (state.runtime.mode !== 'rest') {
      clearRestTimer()
      return
    }

    if (restTimerId !== undefined) {
      return
    }

    restTimerId = timerSet(() => {
      if (state.runtime.mode !== 'rest') {
        clearRestTimer()
        return
      }
      dispatch({ type: 'tick-rest' })
    }, 1000)
  }

  const transition = (nextRuntime: Runtime, beepOnExit = false): void => {
    const previous = state.runtime
    const snapshot = isRecoverableRuntime(nextRuntime)
      ? persistRuntime(nextRuntime)
      : clearRuntimeSnapshot()
    state = {
      ...state,
      runtime: nextRuntime,
      runtimeSnapshot: snapshot,
      resetConfirmation: false,
    }
    syncRestTimer()
    syncVideo(previous, nextRuntime, beepOnExit)
    publish()
  }

  const recordAction = (label: string): void => {
    state = { ...state, lastAction: label }
    publish()
  }

  const setPlanInput = (rawInput: string): void => {
    const result = parsePlan(rawInput)
    const nextExercises = result.errors.length === 0 ? result.exercises : state.exercises
    const nextGroup: StoredPlan = {
      ...state.activeGroup,
      rawInput,
      savedExercises: nextExercises,
      settings: { ...state.settings },
      bvid,
      updatedAt: now(),
      createdAt: state.activeGroup.createdAt ?? now(),
    }
    state = {
      ...state,
      rawInput,
      exercises: nextExercises,
      parseErrors: result.errors,
      view: nextExercises.length === 0 ? 'workbench' : state.view,
    }
    saveLibrary(nextGroup)
    recordAction('set-plan-input')
  }

  const setSettings = (nextSettings: Partial<Settings>): void => {
    const settings = { ...state.settings, ...nextSettings }
    const nextGroup: StoredPlan = { ...state.activeGroup, settings, updatedAt: now() }
    state = { ...state, settings }
    saveLibrary(nextGroup)
    recordAction('set-settings')
  }

  const setPlanInfo = (info: Partial<Pick<StoredPlan, 'title' | 'author' | 'notes'>>): void => {
    const nextGroup: StoredPlan = {
      ...state.activeGroup,
      ...(typeof info.title === 'string' ? { title: info.title } : {}),
      ...(typeof info.author === 'string' ? { author: info.author } : {}),
      ...(typeof info.notes === 'string' ? { notes: info.notes } : {}),
      updatedAt: now(),
    }
    saveLibrary(nextGroup)
    recordAction('future:plan-info')
  }

  const insertTimestamp = (kind: 'start' | 'end'): void => {
    const currentTime = Number.isFinite(video?.currentTime) ? Math.max(0, video?.currentTime ?? 0) : 0
    const timestamp = formatTimestamp(currentTime)
    const line = kind === 'start' ? `动作 ${timestamp}-` : `${timestamp} 3x8-12 rest45`
    const rawInput = state.rawInput
      ? `${state.rawInput.trimEnd()}${kind === 'start' ? '\n' : ''}${line}`
      : line
    setPlanInput(rawInput)
    recordAction(`future:insert-${kind}`)
  }

  const setPreviewLocked = (locked: boolean): void => {
    state = { ...state, previewLocked: locked }
    try {
      const saved = storage?.getItem(defaultPreferencesStorageKey)
      const parsed = saved ? JSON.parse(saved) : {}
      writeStorage(storage, defaultPreferencesStorageKey, {
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
        previewLocked: locked,
      })
    } catch {
      writeStorage(storage, defaultPreferencesStorageKey, { previewLocked: locked })
    }
    recordAction(`future:preview-locked:${locked}`)
  }

  const requestRuntimeRecovery = (): RuntimeSnapshot | null => {
    const snapshot = state.runtimeSnapshot
    if (!snapshot || !isRuntimeSnapshotCompatible(snapshot, state)) {
      return null
    }

    state = {
      ...state,
      selectedExerciseIndex: snapshot.runtime.exerciseIndex,
      view: 'training',
    }
    transition(snapshot.runtime)
    recordAction('future:runtime-recovered')
    return snapshot
  }

  const createImportedLibrary = (
    imported: ReturnType<typeof normalizeImportedPlanData>,
    fallbackTitle: string,
  ): StoredPlanLibrary => {
    const usedIds = new Set<string>()
    const importedBvid = imported.bvid ?? bvid
    const groups = imported.groups.map((group, index) => {
      const parsed = parsePlan(group.rawInput)
      if (parsed.errors.length > 0) {
        const label = group.title ?? `子分组 ${index + 1}`
        throw new Error(`${label} 时间戳格式错误：${parsed.errors[0]}`)
      }

      let id = group.id ?? ''
      while (!id || usedIds.has(id)) {
        id = createGroupId()
      }
      usedIds.add(id)

      const title =
        group.title ??
        (imported.groups.length === 1
          ? imported.title ?? fallbackTitle
          : `${fallbackTitle} ${index + 1}`)
      const importedGroup = normalizeStoredPlan(
        {
          id,
          rawInput: group.rawInput,
          settings: group.settings ?? state.settings,
          savedExercises: parsed.exercises.length > 0 ? parsed.exercises : group.exercises,
          bvid: importedBvid,
          title,
          author: group.author ?? imported.author ?? undefined,
          notes: group.notes ?? imported.notes ?? undefined,
          createdAt: now(),
          updatedAt: now(),
        },
        title,
        index,
        bvid,
      )
      if (!importedGroup) {
        throw new Error(`第 ${index + 1} 个子分组格式无效`)
      }
      return importedGroup
    })

    const activeGroup = groups[0]
    if (!activeGroup) {
      throw new Error('JSON 缺少子分组')
    }

    return {
      schemaVersion: 2,
      bvid: bvid ?? importedBvid,
      activeGroupId: activeGroup.id,
      groups,
      updatedAt: now(),
    }
  }

  const applyImportedLibrary = (nextLibrary: StoredPlanLibrary, status: string): void => {
    const nextActiveGroup =
      nextLibrary.groups.find(group => group.id === nextLibrary.activeGroupId) ?? nextLibrary.groups[0]
    if (!nextActiveGroup) {
      throw new Error('JSON 缺少可用子分组')
    }

    const parsed = parsePlan(nextActiveGroup.rawInput)
    const nextExercises =
      nextActiveGroup.savedExercises.length > 0 ? nextActiveGroup.savedExercises : parsed.exercises
    state = {
      ...state,
      library: nextLibrary,
      activeGroup: nextActiveGroup,
      activeGroupId: nextActiveGroup.id,
      rawInput: nextActiveGroup.rawInput,
      exercises: nextExercises,
      parseErrors: parsed.errors,
      settings: { ...nextActiveGroup.settings },
      selectedExerciseIndex: 0,
      view: nextExercises.length > 0 ? 'training' : 'workbench',
      resetConfirmation: false,
    }
    writeStorage(storage, planKey, nextLibrary)
    transition(createIdleRuntime(0))
    recordAction(status)
  }

  const exportPlan = (): void => {
    try {
      const contents = JSON.stringify(state.library, null, 2)
      const safeId = (bvid ?? storageId).replace(/[^0-9A-Za-z_-]+/g, '-')
      const filename = `bili-fitness-timer-${safeId || 'plan'}-${new Date().toISOString().slice(0, 10)}.json`
      downloadJson(filename, contents)
      recordAction('已导出本地 JSON')
    } catch (error) {
      recordAction(`导出失败：${importErrorMessage(error, '当前环境不支持 JSON 导出')}`)
    }
  }

  const importPlan = async (): Promise<void> => {
    const operation = ++importOperation
    state = { ...state, lastAction: '正在选择本地 JSON' }
    publish()

    try {
      const contents = await readJsonFile()
      if (operation !== importOperation || disposed) {
        return
      }
      if (contents === null) {
        recordAction('已取消本地导入')
        return
      }

      const imported = normalizeImportedPlanData(JSON.parse(contents))
      const nextLibrary = createImportedLibrary(imported, '导入计划')
      applyImportedLibrary(nextLibrary, `已导入本地 JSON：${nextLibrary.groups.length} 个子分组`)
    } catch (error) {
      if (operation === importOperation && !disposed) {
        recordAction(`导入失败：${importErrorMessage(error, '请选择有效的 JSON 计划文件')}`)
      }
    }
  }

  const importOnlinePlan = async (): Promise<void> => {
    const operation = ++importOperation
    if (!bvid) {
      recordAction('在线导入失败：未识别到当前视频 BV 号')
      return
    }
    if (!fetchJson) {
      recordAction('在线导入失败：当前环境不支持网络请求')
      return
    }

    state = { ...state, lastAction: `正在在线导入 ${bvid}` }
    publish()

    try {
      const response = await fetchJson(getTimestampLibraryUrl(bvid))
      if (response.status === 404) {
        throw new Error('未找到该视频的在线时间戳')
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const imported = normalizeImportedPlanData(await response.json())
      if (imported.bvid && imported.bvid !== bvid) {
        throw new Error(`在线文件 BV 号不匹配：${imported.bvid}`)
      }
      const nextLibrary = createImportedLibrary(imported, getDefaultTitle())
      if (operation !== importOperation || disposed) {
        return
      }
      applyImportedLibrary(nextLibrary, `已在线导入 ${bvid}：${nextLibrary.groups.length} 个子分组`)
    } catch (error) {
      if (operation === importOperation && !disposed) {
        recordAction(`在线导入失败：${importErrorMessage(error, '网络请求或 JSON 格式无效')}`)
      }
    }
  }

  const requestReset = (): void => {
    if (state.runtime.mode !== 'idle' && state.runtime.mode !== 'complete') {
      state = { ...state, resetConfirmation: true }
      publish()
      return
    }
    transition(resetRuntime(state.selectedExerciseIndex))
  }

  const createGroup = (): void => {
    const title = uniqueGroupTitle(`子分组 ${state.library.groups.length + 1}`, state.library.groups)
    const group = createEmptyGroup(bvid, title, now)
    const nextLibrary: StoredPlanLibrary = {
      ...state.library,
      activeGroupId: group.id,
      groups: [...state.library.groups, group],
      updatedAt: now(),
    }
    activateGroup(nextLibrary, group, 'future:create-group')
  }

  const duplicateActiveGroup = (): void => {
    const source = state.activeGroup
    const title = uniqueGroupTitle(`${source.title?.trim() || '子分组'} 副本`, state.library.groups)
    const timestamp = now()
    const group: StoredPlan = {
      ...source,
      id: createGroupId(),
      title,
      savedExercises: source.savedExercises.map(exercise => ({ ...exercise })),
      settings: { ...source.settings },
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const nextLibrary: StoredPlanLibrary = {
      ...state.library,
      activeGroupId: group.id,
      groups: [...state.library.groups, group],
      updatedAt: timestamp,
    }
    activateGroup(nextLibrary, group, 'future:duplicate-group')
  }

  const switchGroup = (groupId: string): void => {
    const target = state.library.groups.find(group => group.id === groupId)
    if (!target) {
      recordAction(`future:switch-group-not-found:${groupId}`)
      return
    }

    if (target.id === state.activeGroupId) {
      recordAction(`future:switch-group:${groupId}`)
      return
    }

    const nextLibrary: StoredPlanLibrary = {
      ...state.library,
      activeGroupId: target.id,
      updatedAt: now(),
    }
    activateGroup(nextLibrary, target, `future:switch-group:${groupId}`)
  }

  const renameGroup = (groupId: string, title: string): void => {
    const target = state.library.groups.find(group => group.id === groupId)
    const nextTitle = title.trim()
    if (!target || !nextTitle) {
      recordAction(`future:rename-group-invalid:${groupId}`)
      return
    }

    const nextGroup: StoredPlan = { ...target, title: nextTitle, updatedAt: now() }
    const nextLibrary: StoredPlanLibrary = {
      ...state.library,
      groups: state.library.groups.map(group => (group.id === groupId ? nextGroup : group)),
      updatedAt: now(),
    }
    if (groupId === state.activeGroupId) {
      state = { ...state, activeGroup: nextGroup }
    }
    persistLibrary(nextLibrary)
    recordAction(`future:rename-group:${groupId}`)
  }

  const deleteGroup = (groupId: string): void => {
    if (state.library.groups.length <= 1) {
      recordAction('future:delete-group-blocked-last')
      return
    }

    const targetIndex = state.library.groups.findIndex(group => group.id === groupId)
    if (targetIndex < 0) {
      recordAction(`future:delete-group-not-found:${groupId}`)
      return
    }

    const nextGroups = state.library.groups.filter(group => group.id !== groupId)
    if (groupId !== state.activeGroupId) {
      persistLibrary({
        ...state.library,
        groups: nextGroups,
        updatedAt: now(),
      })
      recordAction(`future:delete-group:${groupId}`)
      return
    }

    const nextActive = nextGroups[Math.min(targetIndex, nextGroups.length - 1)]
    if (!nextActive) {
      recordAction('future:delete-group-blocked-last')
      return
    }

    activateGroup(
      {
        ...state.library,
        activeGroupId: nextActive.id,
        groups: nextGroups,
        updatedAt: now(),
      },
      nextActive,
      `future:delete-group:${groupId}`,
    )
  }

  const future: FutureActions = {
    createGroup,
    duplicateActiveGroup,
    switchGroup,
    renameGroup,
    deleteGroup,
    importPlan,
    exportPlan,
    importOnlinePlan,
    setPlanInfo,
    insertTimestamp,
    setPreviewLocked,
    requestRuntimeRecovery,
  }

  function dispatch(action: StoreAction): void {
    if (disposed) {
      return
    }

    switch (action.type) {
      case 'start-training': {
        const selectedExerciseIndex = action.exerciseIndex ?? state.selectedExerciseIndex
        state = { ...state, view: 'training' }
        state = { ...state, selectedExerciseIndex }
        transition(startTraining(state.exercises, selectedExerciseIndex))
        return
      }
      case 'complete-set':
        transition(completeSet(state.exercises, state.runtime))
        return
      case 'tick-rest': {
        const next = tickRest(state.exercises, state.runtime)
        transition(next, state.runtime.mode === 'rest' && next.mode !== 'rest')
        return
      }
      case 'skip-rest':
        transition(skipRest(state.exercises, state.runtime))
        return
      case 'pause':
        transition(pauseRuntime(state.runtime))
        return
      case 'resume':
        transition(resumeRuntime(state.runtime))
        return
      case 'reset':
        requestReset()
        return
      case 'confirm-reset':
        transition(resetRuntime(state.selectedExerciseIndex))
        return
      case 'cancel-reset':
        state = { ...state, resetConfirmation: false }
        publish()
        return
      case 'switch-exercise':
        if (
          state.previewLocked &&
          state.runtime.mode !== 'idle' &&
          state.runtime.mode !== 'complete'
        ) {
          recordAction('switch-exercise-blocked-preview-locked')
          return
        }
        if (!state.exercises[action.exerciseIndex]) {
          transition(switchToExercise(state.exercises, state.runtime, action.exerciseIndex))
          return
        }
        state = { ...state, selectedExerciseIndex: action.exerciseIndex }
        transition(switchToExercise(state.exercises, state.runtime, action.exerciseIndex))
        return
      case 'set-plan-input':
        setPlanInput(action.rawInput)
        return
      case 'set-settings':
        setSettings(action.settings)
        return
      case 'set-view':
        state = { ...state, view: action.view, resetConfirmation: false }
        publish()
        return
      case 'set-group-page':
        state = {
          ...state,
          groupPage: Math.max(1, Math.min(Math.trunc(action.page), Math.ceil(state.library.groups.length / state.groupPageSize) || 1)),
        }
        publish()
        return
      case 'future': {
        const futureAction = future[action.action]
        if (futureAction) {
          ;(futureAction as () => void)()
        }
        return
      }
    }
  }

  const actions: WorkoutStore['actions'] = {
    startTraining: exerciseIndex => dispatch({ type: 'start-training', exerciseIndex }),
    completeSet: () => dispatch({ type: 'complete-set' }),
    tickRest: () => dispatch({ type: 'tick-rest' }),
    skipRest: () => dispatch({ type: 'skip-rest' }),
    pause: () => dispatch({ type: 'pause' }),
    resume: () => dispatch({ type: 'resume' }),
    reset: () => dispatch({ type: 'reset' }),
    confirmReset: () => dispatch({ type: 'confirm-reset' }),
    cancelReset: () => dispatch({ type: 'cancel-reset' }),
    switchToExercise: exerciseIndex => dispatch({ type: 'switch-exercise', exerciseIndex }),
    setPlanInput: rawInput => dispatch({ type: 'set-plan-input', rawInput }),
    setSettings: next => dispatch({ type: 'set-settings', settings: next }),
    setView: view => dispatch({ type: 'set-view', view }),
    setGroupPage: page => dispatch({ type: 'set-group-page', page }),
  }

  return {
    getState: () => state,
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispatch,
    attachVideo: nextVideo => {
      video = nextVideo
      state = {
        ...state,
        currentVideoTime: Number.isFinite(nextVideo.currentTime) ? Math.max(0, nextVideo.currentTime) : 0,
      }
      nextVideo.addEventListener('timeupdate', () => {
        const currentTime = Number.isFinite(nextVideo.currentTime) ? Math.max(0, nextVideo.currentTime) : 0
        if (currentTime === state.currentVideoTime) {
          return
        }
        state = { ...state, currentVideoTime: currentTime }
        publish()
      })
      bindVideoLoopGuard(nextVideo as HTMLVideoElement, currentSegment)
      if (state.runtime.mode === 'exercise') {
        seekAndPlay()
      }
    },
    dispose: () => {
      disposed = true
      importOperation += 1
      clearRestTimer()
      listeners.clear()
      video = null
    },
    actions,
    future,
  }
}
