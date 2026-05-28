import {
  type Exercise,
  booleanPreference,
  defaultPreferencesStorageKey,
  extractBvidFromUrl,
  formatTimestamp,
  getPlanStorageKey,
  getTimestampLibraryUrl,
  normalizeBvid,
  normalizeExerciseList,
  normalizeImportedPlanData,
  parsePlan,
  serializeExercises,
} from './core'

type Mode = 'idle' | 'exercise' | 'rest' | 'paused' | 'complete'

interface Settings {
  beepDuration: number
  pauseDuringRest: boolean
}

interface Runtime {
  mode: Mode
  exerciseIndex: number
  setIndex: number
  restRemaining: number
  beforePauseMode: Exclude<Mode, 'paused'>
}

interface StoredPlan {
  id: string
  rawInput: string
  settings: Settings
  savedExercises: Exercise[]
  bvid?: string | null
  title?: string
  author?: string
  notes?: string
  createdAt?: number
  updatedAt?: number
}

interface StoredPlanLibrary {
  schemaVersion: 2
  bvid?: string | null
  activeGroupId: string
  groups: StoredPlan[]
  updatedAt?: number
}

interface PanelPosition {
  left: number
  top: number
}

interface Preferences {
  panelPosition: PanelPosition | null
  inputCollapsed: boolean
  previewCollapsed: boolean
  managerCollapsed: boolean
  previewLocked: boolean
}

const panelId = 'bili-fitness-timer-panel'
const styleId = 'bili-fitness-timer-style'
const preferencesStorageKey = defaultPreferencesStorageKey
const defaultSettings: Settings = {
  beepDuration: 2,
  pauseDuringRest: true,
}

let video: HTMLVideoElement | null = null
let exercises: Exercise[] = []
let rawInput = ''
let settings: Settings = { ...defaultSettings }
let collapsed = false
let inputCollapsed = false
let previewCollapsed = false
let managerCollapsed = false
let previewLocked = true
let selectedStartIndex = 0
let panelPosition: PanelPosition | null = null
let saveStatusText = '已自动保存'
let onlineImportBusy = false
let runtime: Runtime = {
  mode: 'idle',
  exerciseIndex: 0,
  setIndex: 0,
  restRemaining: 0,
  beforePauseMode: 'idle',
}

let restTimerId: number | undefined
let navigationWatcherId: number | undefined
let viewportWatcherReady = false
let activeStorageKey = ''
let activeGroupId = ''
let activePlanTitle = ''
let activePlanAuthor = ''
let activePlanNotes = ''
let planGroups: StoredPlan[] = []
let initInProgress = false
let navigationReloadInProgress = false
const guardedVideos = new WeakSet<HTMLVideoElement>()

interface RenderOptions {
  restoreTextarea?: {
    selectionStart: number
    selectionEnd: number
  }
}

function getCurrentBvid(): string | null {
  return extractBvidFromUrl(location.href)
}

function getCurrentStorageId(): string {
  return getCurrentBvid() ?? location.pathname
}

function getStorageKey(): string {
  return getPlanStorageKey(getCurrentStorageId())
}

function createGroupId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `group-${random}`
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function createEmptyGroup(title = '训练分组 1'): StoredPlan {
  const now = Date.now()
  return {
    id: createGroupId(),
    rawInput: '',
    settings: { ...defaultSettings },
    savedExercises: [],
    bvid: getCurrentBvid(),
    title,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeStoredPlan(value: unknown, fallbackTitle: string, index = 0): StoredPlan | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const parsed = value as Partial<StoredPlan>
  const savedExercises = normalizeExerciseList(parsed.savedExercises)
  const id = optionalText(parsed.id) ?? `legacy-${index + 1}`
  const title = optionalText(parsed.title) ?? fallbackTitle
  return {
    id,
    rawInput:
      typeof parsed.rawInput === 'string'
        ? parsed.rawInput
        : serializeExercises(savedExercises),
    settings: {
      beepDuration:
        typeof parsed.settings?.beepDuration === 'number'
          ? parsed.settings.beepDuration
          : defaultSettings.beepDuration,
      pauseDuringRest:
        typeof parsed.settings?.pauseDuringRest === 'boolean'
          ? parsed.settings.pauseDuringRest
          : defaultSettings.pauseDuringRest,
    },
    savedExercises,
    bvid: typeof parsed.bvid === 'string' ? normalizeBvid(parsed.bvid) : getCurrentBvid(),
    title,
    author: optionalText(parsed.author),
    notes: optionalText(parsed.notes),
    createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : undefined,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
  }
}

function createLibraryFromLegacy(parsed: unknown): StoredPlanLibrary {
  const legacyGroup =
    normalizeStoredPlan(parsed, document.title || getCurrentStorageId()) ?? createEmptyGroup()
  activeGroupId = legacyGroup.id
  return {
    schemaVersion: 2,
    bvid: getCurrentBvid(),
    activeGroupId: legacyGroup.id,
    groups: [legacyGroup],
    updatedAt: legacyGroup.updatedAt,
  }
}

function loadPlanLibrary(): StoredPlanLibrary {
  const fallbackGroup = createEmptyGroup()
  const fallback: StoredPlanLibrary = {
    schemaVersion: 2,
    bvid: getCurrentBvid(),
    activeGroupId: fallbackGroup.id,
    groups: [fallbackGroup],
    updatedAt: fallbackGroup.updatedAt,
  }

  try {
    const saved = localStorage.getItem(getStorageKey())
    if (!saved) {
      return fallback
    }

    const parsed = JSON.parse(saved) as Partial<StoredPlanLibrary> & Partial<StoredPlan>
    if (!Array.isArray(parsed.groups)) {
      return createLibraryFromLegacy(parsed)
    }

    const groups = parsed.groups
      .map((group, index) => normalizeStoredPlan(group, `训练分组 ${index + 1}`, index))
      .filter((group): group is StoredPlan => group !== null)
    if (groups.length === 0) {
      return fallback
    }

    const activeId = optionalText(parsed.activeGroupId)
    const activeGroupId = activeId && groups.some(group => group.id === activeId) ? activeId : groups[0].id
    return {
      schemaVersion: 2,
      bvid: typeof parsed.bvid === 'string' ? normalizeBvid(parsed.bvid) : getCurrentBvid(),
      activeGroupId,
      groups,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    }
  } catch {
    return fallback
  }
}

function getActiveGroup(library = planGroups): StoredPlan | null {
  return library.find(group => group.id === activeGroupId) ?? library[0] ?? null
}

function applyPlanGroup(group: StoredPlan, groups = planGroups): void {
  planGroups = groups
  activeGroupId = group.id
  rawInput = group.rawInput
  settings = group.settings
  exercises = group.savedExercises
  activePlanTitle = group.title ?? document.title
  activePlanAuthor = group.author ?? ''
  activePlanNotes = group.notes ?? ''
  selectedStartIndex = 0
  clearRestTimer()
  resetRuntime()
}

function loadPlan(): StoredPlan {
  const library = loadPlanLibrary()
  planGroups = library.groups
  activeGroupId = library.activeGroupId
  return getActiveGroup(library.groups) ?? createEmptyGroup()
}

function savePlan(statusText = '已自动保存', nextActiveGroupId = activeGroupId): void {
  const parseResult = parsePlan(rawInput)
  const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises
  const now = Date.now()
  let hasActiveGroup = false
  const nextGroups = planGroups.map(group => {
    if (group.id !== nextActiveGroupId) {
      return group
    }
    hasActiveGroup = true
    return {
      ...group,
      rawInput,
      settings,
      savedExercises,
      bvid: getCurrentBvid(),
      title: activePlanTitle || group.title || document.title || getCurrentStorageId(),
      author: optionalText(activePlanAuthor),
      notes: optionalText(activePlanNotes),
      createdAt: group.createdAt ?? now,
      updatedAt: now,
    } satisfies StoredPlan
  })

  if (!hasActiveGroup) {
    nextGroups.push({
      ...createEmptyGroup(activePlanTitle || '训练分组 1'),
      id: nextActiveGroupId || createGroupId(),
      rawInput,
      settings,
      savedExercises,
      author: optionalText(activePlanAuthor),
      notes: optionalText(activePlanNotes),
      updatedAt: now,
    })
  }

  planGroups = nextGroups
  activeGroupId = nextActiveGroupId || nextGroups[0]?.id || ''
  localStorage.setItem(
    getStorageKey(),
    JSON.stringify({
      schemaVersion: 2,
      bvid: getCurrentBvid(),
      activeGroupId,
      groups: nextGroups,
      updatedAt: now,
    } satisfies StoredPlanLibrary),
  )
  saveStatusText =
    parseResult.errors.length === 0 ? statusText : '输入有错误，已保留上次有效动作'
}

function persistPlanLibrary(statusText = '已保存分组'): void {
  localStorage.setItem(
    getStorageKey(),
    JSON.stringify({
      schemaVersion: 2,
      bvid: getCurrentBvid(),
      activeGroupId,
      groups: planGroups,
      updatedAt: Date.now(),
    } satisfies StoredPlanLibrary),
  )
  saveStatusText = statusText
}

function loadPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(preferencesStorageKey)
    if (!saved) {
      return {
        panelPosition: null,
        inputCollapsed: false,
        previewCollapsed: false,
        managerCollapsed: false,
        previewLocked: true,
      }
    }

    const parsed = JSON.parse(saved) as Partial<Preferences>
    const position = parsed.panelPosition
    const nextPreferences: Preferences = {
      panelPosition: null,
      inputCollapsed: booleanPreference(parsed.inputCollapsed, false),
      previewCollapsed: booleanPreference(parsed.previewCollapsed, false),
      managerCollapsed: booleanPreference(parsed.managerCollapsed, false),
      previewLocked: booleanPreference(parsed.previewLocked, true),
    }
    if (
      position &&
      typeof position.left === 'number' &&
      typeof position.top === 'number'
    ) {
      nextPreferences.panelPosition = {
        left: position.left,
        top: position.top,
      }
    }

    return nextPreferences
  } catch {
    return {
      panelPosition: null,
      inputCollapsed: false,
      previewCollapsed: false,
      managerCollapsed: false,
      previewLocked: true,
    }
  }

  return {
    panelPosition: null,
    inputCollapsed: false,
    previewCollapsed: false,
    managerCollapsed: false,
    previewLocked: true,
  }
}

function savePreferences(): void {
  localStorage.setItem(
    preferencesStorageKey,
    JSON.stringify({
      panelPosition,
      inputCollapsed,
      previewCollapsed,
      managerCollapsed,
      previewLocked,
    } satisfies Preferences),
  )
}

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 720px)').matches
}

function clampPanelPosition(position: PanelPosition, panel: HTMLElement): PanelPosition {
  const margin = 10
  const rect = panel.getBoundingClientRect()
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin)
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin)
  return {
    left: Math.min(Math.max(position.left, margin), maxLeft),
    top: Math.min(Math.max(position.top, margin), maxTop),
  }
}

function applyPanelPosition(panel: HTMLElement): void {
  if (isMobileViewport()) {
    panel.style.left = ''
    panel.style.right = ''
    panel.style.top = ''
    panel.style.bottom = ''
    return
  }

  if (!panelPosition) {
    panel.style.left = ''
    panel.style.right = ''
    panel.style.top = ''
    panel.style.bottom = ''
    return
  }

  const nextPosition = clampPanelPosition(panelPosition, panel)
  panelPosition = nextPosition
  panel.style.left = `${nextPosition.left}px`
  panel.style.top = `${nextPosition.top}px`
  panel.style.right = 'auto'
  panel.style.bottom = 'auto'
}

function setupPanelDrag(header: HTMLElement, panel: HTMLElement): void {
  header.addEventListener('pointerdown', event => {
    if (isMobileViewport() || event.button !== 0) {
      return
    }
    if ((event.target as HTMLElement).closest('button')) {
      return
    }

    const startRect = panel.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    header.setPointerCapture(event.pointerId)
    header.classList.add('bft-header-dragging')

    const handleMove = (moveEvent: PointerEvent) => {
      const next = clampPanelPosition(
        {
          left: startRect.left + moveEvent.clientX - startX,
          top: startRect.top + moveEvent.clientY - startY,
        },
        panel,
      )
      panelPosition = next
      panel.style.left = `${next.left}px`
      panel.style.top = `${next.top}px`
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
    }

    const handleUp = (upEvent: PointerEvent) => {
      header.releasePointerCapture(upEvent.pointerId)
      header.classList.remove('bft-header-dragging')
      header.removeEventListener('pointermove', handleMove)
      header.removeEventListener('pointerup', handleUp)
      header.removeEventListener('pointercancel', handleUp)
      savePreferences()
    }

    header.addEventListener('pointermove', handleMove)
    header.addEventListener('pointerup', handleUp)
    header.addEventListener('pointercancel', handleUp)
  })
}

function exportPlan(): void {
  const parseResult = parsePlan(rawInput)
  const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises
  const payload = {
    bvid: getCurrentBvid(),
    title: activePlanTitle || document.title || undefined,
    author: optionalText(activePlanAuthor),
    notes: optionalText(activePlanNotes),
    rawInput,
    settings,
    savedExercises,
    exercises: savedExercises,
    updatedAt: Date.now(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `bili-fitness-timer-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

function addImportedPlanGroup(
  imported: ReturnType<typeof normalizeImportedPlanData>,
  parsedSettings: Partial<Settings> | undefined,
  fallbackTitle: string,
  statusText: string,
): void {
  const nextGroup: StoredPlan = {
    id: createGroupId(),
    rawInput: imported.rawInput,
    settings: {
      beepDuration:
        typeof parsedSettings?.beepDuration === 'number'
          ? parsedSettings.beepDuration
          : settings.beepDuration,
      pauseDuringRest:
        typeof parsedSettings?.pauseDuringRest === 'boolean'
          ? parsedSettings.pauseDuringRest
          : settings.pauseDuringRest,
    },
    savedExercises: imported.exercises,
    bvid: imported.bvid ?? getCurrentBvid(),
    title: imported.title ?? fallbackTitle,
    author: imported.author ?? undefined,
    notes: imported.notes ?? undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  planGroups = [...planGroups, nextGroup]
  applyPlanGroup(nextGroup, planGroups)

  const parseResult = parsePlan(rawInput)
  exercises = parseResult.errors.length === 0 ? parseResult.exercises : imported.exercises
  savePlan(statusText, nextGroup.id)
  render()
}

async function importPlanFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<StoredPlan>
  const imported = normalizeImportedPlanData(parsed)

  addImportedPlanGroup(
    imported,
    parsed.settings,
    file.name.replace(/\.json$/i, ''),
    '已导入本地 JSON 为新分组',
  )
}

async function importPlanFromOnline(): Promise<void> {
  const bvid = getCurrentBvid()
  if (!bvid) {
    saveStatusText = '未识别到当前视频 BV 号'
    render()
    return
  }

  onlineImportBusy = true
  saveStatusText = `正在在线导入 ${bvid}`
  render()

  try {
    const response = await fetch(getTimestampLibraryUrl(bvid), {
      cache: 'no-store',
    })
    if (response.status === 404) {
      throw new Error('未找到该视频的在线时间戳')
    }
    if (!response.ok) {
      throw new Error(`在线导入失败：HTTP ${response.status}`)
    }

    const imported = normalizeImportedPlanData(await response.json())
    if (imported.bvid && imported.bvid !== bvid) {
      throw new Error(`在线文件 BV 号不匹配：${imported.bvid}`)
    }

    const parseResult = parsePlan(imported.rawInput)
    if (parseResult.errors.length > 0) {
      throw new Error(`在线时间戳格式错误：${parseResult.errors[0]}`)
    }

    addImportedPlanGroup(imported, undefined, document.title, `已在线导入 ${bvid} 为新分组`)
  } catch (error) {
    saveStatusText = error instanceof Error ? error.message : '在线导入失败'
  } finally {
    onlineImportBusy = false
    if (!document.getElementById(panelId)) {
      return
    }
    render()
  }
}

function openImportPicker(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) {
      return
    }
    void importPlanFromFile(file).catch(() => {
      window.alert('导入失败：请选择由健身计时器导出的 JSON 文件')
    })
  })
  input.click()
}

function switchToGroup(groupId: string): void {
  const group = planGroups.find(item => item.id === groupId)
  if (!group) {
    saveStatusText = '未找到训练分组'
    render()
    return
  }

  if (group.id === activeGroupId) {
    return
  }
  savePlan('已保存当前分组')
  const latestGroup = planGroups.find(item => item.id === groupId)
  if (!latestGroup) {
    return
  }
  applyPlanGroup(latestGroup, planGroups)
  persistPlanLibrary('已切换训练分组')
  render()
}

function createNewGroup(): void {
  savePlan('已保存当前分组')
  const group = createEmptyGroup(`训练分组 ${planGroups.length + 1}`)
  planGroups = [...planGroups, group]
  applyPlanGroup(group, planGroups)
  persistPlanLibrary('已新建训练分组')
  render()
}

function duplicateCurrentGroup(): void {
  savePlan('已保存当前分组')
  const current = getActiveGroup()
  if (!current) {
    return
  }
  const now = Date.now()
  const group: StoredPlan = {
    ...current,
    id: createGroupId(),
    title: `${current.title ?? '训练分组'} 副本`,
    createdAt: now,
    updatedAt: now,
  }
  planGroups = [...planGroups, group]
  applyPlanGroup(group, planGroups)
  persistPlanLibrary('已复制当前分组')
  render()
}

function deleteCurrentGroup(): void {
  const current = getActiveGroup()
  if (!current) {
    return
  }
  if (planGroups.length <= 1) {
    window.alert('当前视频至少保留一个训练分组')
    return
  }
  const label = current.title ?? '当前分组'
  if (!window.confirm(`删除训练分组：${label}？`)) {
    return
  }

  const nextGroups = planGroups.filter(group => group.id !== current.id)
  const nextGroup = nextGroups[0]
  if (!nextGroup) {
    return
  }
  planGroups = nextGroups
  applyPlanGroup(nextGroup, planGroups)
  persistPlanLibrary('已删除训练分组')
  render()
}

function getCurrentExercise(): Exercise | null {
  return exercises[runtime.exerciseIndex] ?? null
}

function clearRestTimer(): void {
  if (restTimerId !== undefined) {
    window.clearInterval(restTimerId)
    restTimerId = undefined
  }
}

function playCurrentExercise(): void {
  const currentVideo = video
  const exercise = getCurrentExercise()
  if (!currentVideo || !exercise) {
    return
  }

  clearRestTimer()
  runtime.mode = 'exercise'
  runtime.restRemaining = 0
  currentVideo.currentTime = exercise.start
  void currentVideo.play().catch(() => {
    render()
  })
  render()
}

function startTraining(): void {
  if (exercises.length === 0) {
    return
  }
  selectedStartIndex = Math.min(selectedStartIndex, exercises.length - 1)
  runtime = {
    mode: 'exercise',
    exerciseIndex: selectedStartIndex,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: 'exercise',
  }
  playCurrentExercise()
}

function completeSet(): void {
  const currentVideo = video
  const exercise = getCurrentExercise()
  if (!exercise) {
    return
  }

  if (settings.pauseDuringRest) {
    currentVideo?.pause()
  }

  runtime.mode = 'rest'
  runtime.restRemaining = exercise.restSeconds
  startRestCountdown()
  render()
}

function startRestCountdown(): void {
  clearRestTimer()
  restTimerId = window.setInterval(() => {
    if (runtime.mode !== 'rest') {
      clearRestTimer()
      return
    }
    runtime.restRemaining -= 1
    if (runtime.restRemaining <= 0) {
      skipRest(true)
      return
    }
    render()
  }, 1000)
}

function moveToNextUnit(): boolean {
  const exercise = getCurrentExercise()
  if (!exercise) {
    runtime.mode = 'complete'
    return false
  }

  if (runtime.setIndex + 1 < exercise.sets) {
    runtime.setIndex += 1
    return true
  }

  if (runtime.exerciseIndex + 1 < exercises.length) {
    runtime.exerciseIndex += 1
    runtime.setIndex = 0
    return true
  }

  runtime.mode = 'complete'
  return false
}

function skipRest(playBeep = false): void {
  clearRestTimer()
  if (playBeep) {
    void beep(settings.beepDuration)
  }
  if (moveToNextUnit()) {
    playCurrentExercise()
  } else {
    video?.pause()
    render()
  }
}

function togglePause(): void {
  if (runtime.mode === 'paused') {
    runtime.mode = runtime.beforePauseMode
    if (runtime.mode === 'exercise') {
      void video?.play()
    } else if (runtime.mode === 'rest') {
      startRestCountdown()
    }
    render()
    return
  }

  if (runtime.mode === 'idle' || runtime.mode === 'complete') {
    return
  }

  runtime.beforePauseMode = runtime.mode
  runtime.mode = 'paused'
  clearRestTimer()
  video?.pause()
  render()
}

function switchToExercise(index: number): void {
  const exercise = exercises[index]
  if (!exercise) {
    return
  }

  selectedStartIndex = index
  clearRestTimer()
  runtime.exerciseIndex = index
  runtime.setIndex = 0
  runtime.restRemaining = 0

  if (video) {
    video.currentTime = exercise.start
  }

  if (runtime.mode === 'paused') {
    runtime.beforePauseMode = 'exercise'
    render()
    return
  }

  if (runtime.mode === 'exercise' || runtime.mode === 'rest') {
    runtime.mode = 'exercise'
    playCurrentExercise()
    return
  }

  if (runtime.mode === 'complete') {
    runtime.mode = 'idle'
  }
  render()
}

async function beep(durationSeconds: number): Promise<void> {
  type AudioContextConstructor = typeof AudioContext
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  if (!AudioContextConstructor) {
    return
  }

  const context = new AudioContextConstructor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationSeconds)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + durationSeconds)
  await new Promise(resolve => window.setTimeout(resolve, durationSeconds * 1000 + 80))
  await context.close()
}

function setLoopGuard(targetVideo: HTMLVideoElement | null = video): void {
  if (!targetVideo || guardedVideos.has(targetVideo)) {
    return
  }

  guardedVideos.add(targetVideo)
  targetVideo.addEventListener('timeupdate', () => {
    if (video !== targetVideo || runtime.mode !== 'exercise') {
      return
    }
    const exercise = getCurrentExercise()
    if (!exercise) {
      return
    }
    if (targetVideo.currentTime >= exercise.end || targetVideo.currentTime < exercise.start - 0.25) {
      targetVideo.currentTime = exercise.start
      if (targetVideo.paused) {
        void targetVideo.play()
      }
    }
  })
}

function waitForVideo(timeoutMs = 10000): Promise<HTMLVideoElement | null> {
  const existing = document.querySelector<HTMLVideoElement>('video')
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise(resolve => {
    const observer = new MutationObserver(() => {
      const found = document.querySelector<HTMLVideoElement>('video')
      if (found) {
        observer.disconnect()
        resolve(found)
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
    window.setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeoutMs)
  })
}

function injectStyle(): void {
  if (document.getElementById(styleId)) {
    return
  }

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    #${panelId} {
      position: fixed;
      right: 14px;
      top: 88px;
      z-index: 2147483647;
      width: min(620px, calc(100vw - 28px));
      max-height: calc(100vh - 104px);
      color: #f6f7f9;
      background: rgba(22, 24, 29, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.34);
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    #${panelId} * {
      box-sizing: border-box;
    }
    #${panelId} button,
    #${panelId} select,
    #${panelId} textarea,
    #${panelId} input {
      font: inherit;
    }
    .bft-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 7px 9px;
      background: rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
    .bft-header-dragging {
      cursor: grabbing;
    }
    .bft-title {
      font-weight: 700;
      letter-spacing: 0;
    }
    .bft-body {
      display: grid;
      gap: 8px;
      padding: 9px;
      max-height: calc(100vh - 150px);
      overflow: auto;
    }
    .bft-collapsed .bft-body {
      display: none;
    }
    .bft-collapsed {
      width: auto;
      min-width: 96px;
    }
    .bft-control-stack {
      display: grid;
      gap: 7px;
      position: sticky;
      top: 0;
      z-index: 1;
      padding-bottom: 2px;
      background: linear-gradient(180deg, rgba(22, 24, 29, 0.98), rgba(22, 24, 29, 0.9));
    }
    .bft-main-grid {
      display: grid;
      gap: 8px;
    }
    .bft-main-left,
    .bft-main-right {
      display: grid;
      gap: 8px;
      align-content: start;
      min-width: 0;
    }
    .bft-status {
      display: grid;
      gap: 3px;
      padding: 7px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 6px;
    }
    .bft-section {
      display: grid;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.035);
    }
    .bft-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 7px;
      background: rgba(255, 255, 255, 0.055);
    }
    .bft-section-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
      flex-wrap: wrap;
    }
    .bft-section-body {
      display: grid;
      gap: 7px;
      padding: 7px;
    }
    .bft-tool-group {
      display: grid;
      gap: 4px;
    }
    .bft-tool-label {
      font-size: 11px;
      color: rgba(246, 247, 249, 0.58);
    }
    .bft-field-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 6px;
    }
    .bft-field {
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .bft-field-label {
      font-size: 11px;
      color: rgba(246, 247, 249, 0.58);
    }
    .bft-control-row .bft-button {
      flex: 1 1 calc(50% - 6px);
    }
    .bft-complete-row {
      display: grid;
    }
    .bft-complete-button {
      width: 100%;
      min-height: 48px;
      font-size: 15px;
      letter-spacing: 0;
    }
    .bft-muted {
      color: rgba(246, 247, 249, 0.68);
    }
    .bft-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .bft-row > * {
      flex: 0 0 auto;
    }
    .bft-grow {
      flex: 1 1 120px;
    }
    .bft-input {
      width: 100%;
      min-height: 86px;
      resize: vertical;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 7px;
      outline: none;
    }
    .bft-text-input {
      width: 100%;
      min-width: 0;
      min-height: 28px;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 5px 7px;
      outline: none;
    }
    .bft-notes-input {
      min-height: 58px;
    }
    .bft-input:focus,
    .bft-text-input:focus,
    .bft-select:focus {
      border-color: #4cc9a7;
    }
    .bft-button {
      min-height: 26px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      color: #f6f7f9;
      background: rgba(255, 255, 255, 0.1);
      padding: 3px 7px;
      cursor: pointer;
      font-size: 12px;
    }
    .bft-button:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .bft-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .bft-primary {
      color: #07120f;
      background: #4cc9a7;
      border-color: #4cc9a7;
      font-weight: 700;
    }
    .bft-primary:hover {
      background: #6dd8ba;
    }
    .bft-danger {
      color: #ffd9d9;
      border-color: rgba(255, 114, 114, 0.42);
      background: rgba(255, 114, 114, 0.16);
    }
    .bft-select {
      min-height: 28px;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 3px 6px;
    }
    .bft-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(246, 247, 249, 0.82);
    }
    .bft-list {
      display: grid;
      gap: 5px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bft-manager-list {
      display: grid;
      gap: 6px;
      max-height: 220px;
      overflow: auto;
    }
    .bft-manager-item {
      display: grid;
      gap: 5px;
      padding: 7px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
    }
    .bft-manager-active {
      border-color: rgba(76, 201, 167, 0.85);
      background: rgba(76, 201, 167, 0.12);
    }
    .bft-manager-item strong,
    .bft-manager-item .bft-muted {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .bft-item {
      display: grid;
      gap: 2px;
      width: 100%;
      color: inherit;
      text-align: left;
      cursor: pointer;
      padding: 6px 7px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
    }
    .bft-item:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    .bft-item-active {
      border-color: rgba(76, 201, 167, 0.85);
      background: rgba(76, 201, 167, 0.12);
    }
    .bft-item-selected {
      border-color: rgba(255, 213, 97, 0.78);
    }
    .bft-empty {
      padding: 7px;
      color: rgba(246, 247, 249, 0.64);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
    }
    .bft-error {
      display: grid;
      gap: 3px;
      color: #ffb9b9;
      padding: 8px;
      border-radius: 6px;
      background: rgba(255, 81, 81, 0.12);
    }
    @media (max-width: 720px) {
      #${panelId} {
        left: 6px;
        right: 6px;
        top: auto;
        bottom: max(0px, env(safe-area-inset-bottom));
        width: auto;
        max-height: min(72dvh, 540px);
        border-radius: 8px 8px 0 0;
      }
      .bft-header {
        cursor: default;
        touch-action: auto;
      }
      .bft-body {
        gap: 7px;
        padding: 8px;
        max-height: calc(min(72dvh, 540px) - 42px);
      }
      .bft-input {
        min-height: 76px;
      }
      .bft-field-grid {
        grid-template-columns: 1fr;
      }
      .bft-button,
      .bft-select {
        min-height: 34px;
      }
      .bft-tool-row .bft-button,
      .bft-control-row .bft-button {
        flex: 1 1 calc(50% - 6px);
        padding: 5px 6px;
        font-size: 12px;
      }
      .bft-complete-button {
        min-height: 54px;
        font-size: 15px;
      }
      .bft-tool-group .bft-button {
        flex: 1 1 calc(50% - 6px);
      }
      .bft-status {
        padding: 7px;
      }
      .bft-row {
        gap: 6px;
      }
      .bft-collapsed {
        left: auto;
        right: 8px;
        width: auto;
        min-width: 88px;
        border-radius: 8px;
      }
    }
    @media (min-width: 721px) and (max-width: 1024px) {
      #${panelId} {
        right: 12px;
        top: 72px;
        width: min(680px, calc(100vw - 24px));
        max-height: calc(100vh - 90px);
      }
      .bft-body {
        max-height: calc(100vh - 130px);
      }
      .bft-button,
      .bft-select {
        min-height: 32px;
      }
      .bft-tool-group .bft-button {
        flex: 1 1 calc(50% - 6px);
      }
    }
    @media (min-width: 820px) {
      .bft-main-grid {
        grid-template-columns: minmax(250px, 0.9fr) minmax(260px, 1.1fr);
        align-items: start;
      }
    }
  `
  document.head.append(style)
}

function createButton(label: string, onClick: () => void, className = ''): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `bft-button ${className}`.trim()
  button.textContent = label
  button.addEventListener('click', onClick)
  return button
}

function getStatusText(): string {
  const exercise = getCurrentExercise()
  if (runtime.mode === 'complete') {
    return '训练完成'
  }
  if (!exercise) {
    return exercises.length > 0 ? '准备开始' : '请先录入动作'
  }
  if (runtime.mode === 'rest') {
    return `休息 ${runtime.restRemaining}s`
  }
  if (runtime.mode === 'paused') {
    return '已暂停'
  }
  if (runtime.mode === 'exercise') {
    return `动作中：第 ${runtime.setIndex + 1}/${exercise.sets} 组`
  }
  return '准备开始'
}

function createSection(
  titleText: string,
  isCollapsed: boolean,
  onToggle: () => void,
  children: Node[],
  actions: Node[] = [],
): HTMLElement {
  const section = document.createElement('section')
  section.className = `bft-section ${isCollapsed ? 'bft-section-collapsed' : ''}`.trim()

  const header = document.createElement('div')
  header.className = 'bft-section-head'
  const title = document.createElement('strong')
  title.textContent = titleText
  const actionRow = document.createElement('div')
  actionRow.className = 'bft-section-actions'
  actionRow.append(...actions, createButton(isCollapsed ? '展开' : '折叠', onToggle))
  header.append(title, actionRow)
  section.append(header)

  if (!isCollapsed) {
    const body = document.createElement('div')
    body.className = 'bft-section-body'
    body.append(...children)
    section.append(body)
  }

  return section
}

function createToolGroup(labelText: string, buttons: HTMLButtonElement[]): HTMLElement {
  const group = document.createElement('div')
  group.className = 'bft-tool-group'
  const label = document.createElement('span')
  label.className = 'bft-tool-label'
  label.textContent = labelText
  const buttonRow = document.createElement('div')
  buttonRow.className = 'bft-row'
  buttonRow.append(...buttons)
  group.append(label, buttonRow)
  return group
}

function createTextField(
  labelText: string,
  value: string,
  onInput: (value: string) => void,
  multiline = false,
): HTMLElement {
  const label = document.createElement('label')
  label.className = 'bft-field'
  const caption = document.createElement('span')
  caption.className = 'bft-field-label'
  caption.textContent = labelText
  const field = multiline ? document.createElement('textarea') : document.createElement('input')
  field.className = multiline ? 'bft-text-input bft-notes-input' : 'bft-text-input'
  if (field instanceof HTMLInputElement) {
    field.type = 'text'
  }
  field.value = value
  field.addEventListener('input', () => {
    onInput(field.value)
    savePlan()
  })
  label.append(caption, field)
  return label
}

function createPlanInfoForm(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'bft-tool-group'
  const grid = document.createElement('div')
  grid.className = 'bft-field-grid'
  grid.append(
    createTextField('标题', activePlanTitle, value => {
      activePlanTitle = value.trim()
    }),
    createTextField('作者', activePlanAuthor, value => {
      activePlanAuthor = value.trim()
    }),
  )
  wrapper.append(
    grid,
    createTextField('备注', activePlanNotes, value => {
      activePlanNotes = value.trim()
    }, true),
  )
  return wrapper
}

function compactText(value: string, maxLength = 72): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized
}

function getGroupActionCount(group: StoredPlan): number {
  if (group.savedExercises.length > 0) {
    return group.savedExercises.length
  }
  return parsePlan(group.rawInput).exercises.length
}

function createManagerList(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'bft-manager-list'
  const groups = planGroups

  if (groups.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'bft-empty'
    empty.textContent = '暂无训练分组'
    wrapper.append(empty)
    return wrapper
  }

  groups.forEach((group, index) => {
    const item = document.createElement('div')
    item.className = `bft-manager-item ${group.id === activeGroupId ? 'bft-manager-active' : ''}`.trim()
    const title = document.createElement('strong')
    title.textContent = group.title || `训练分组 ${index + 1}`
    const meta = document.createElement('span')
    meta.className = 'bft-muted'
    const updatedText = group.updatedAt
      ? new Date(group.updatedAt).toLocaleString()
      : '未知时间'
    meta.textContent = `${getGroupActionCount(group)} 个动作 · ${updatedText}`
    const extraTexts = [
      group.author ? `作者：${compactText(group.author, 32)}` : '',
      group.notes ? `备注：${compactText(group.notes)}` : '',
    ].filter(Boolean)
    const extra = document.createElement('span')
    extra.className = 'bft-muted'
    extra.textContent = extraTexts.join(' · ')

    const actions = document.createElement('div')
    actions.className = 'bft-row'
    const loadButton = createButton('选择', () => switchToGroup(group.id), 'bft-primary')
    loadButton.disabled = group.id === activeGroupId
    actions.append(loadButton)
    item.append(title, meta)
    if (extraTexts.length > 0) {
      item.append(extra)
    }
    item.append(actions)
    wrapper.append(item)
  })

  return wrapper
}

function createGroupActions(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'bft-tool-group'
  const label = document.createElement('span')
  label.className = 'bft-tool-label'
  label.textContent = `当前视频分组 · ${planGroups.length}`
  const pickerRow = document.createElement('div')
  pickerRow.className = 'bft-row'
  const pickerLabel = document.createElement('label')
  pickerLabel.className = 'bft-row bft-grow'
  const pickerText = document.createElement('span')
  pickerText.textContent = '当前分组'
  const picker = document.createElement('select')
  picker.className = 'bft-select bft-grow'
  planGroups.forEach((group, index) => {
    const option = document.createElement('option')
    option.value = group.id
    option.textContent = group.title || `训练分组 ${index + 1}`
    option.selected = group.id === activeGroupId
    picker.append(option)
  })
  picker.addEventListener('change', () => {
    switchToGroup(picker.value)
  })
  pickerLabel.append(pickerText, picker)
  pickerRow.append(pickerLabel)
  const actions = document.createElement('div')
  actions.className = 'bft-row'
  actions.append(
    createButton('新建分组', createNewGroup, 'bft-primary'),
    createButton('复制当前', duplicateCurrentGroup),
    createButton('删除当前', deleteCurrentGroup, 'bft-danger'),
  )
  wrapper.append(label, pickerRow, actions)
  return wrapper
}

function render(options: RenderOptions = {}): void {
  let panel = document.getElementById(panelId)
  if (!panel) {
    panel = document.createElement('section')
    panel.id = panelId
    document.body.append(panel)
  }
  panel.className = collapsed ? 'bft-collapsed' : ''
  applyPanelPosition(panel)

  const parseResult = parsePlan(rawInput)
  if (parseResult.errors.length === 0) {
    exercises = parseResult.exercises
  }
  if (selectedStartIndex >= exercises.length) {
    selectedStartIndex = Math.max(0, exercises.length - 1)
  }
  if (runtime.exerciseIndex >= exercises.length) {
    runtime.exerciseIndex = 0
    runtime.setIndex = 0
    if (runtime.mode !== 'complete') {
      runtime.mode = 'idle'
    }
  }

  panel.replaceChildren()

  const header = document.createElement('div')
  header.className = 'bft-header'
  const title = document.createElement('div')
  title.className = 'bft-title'
  title.textContent = '健身计时器'
  const collapseButton = createButton(collapsed ? '展开' : '收起', () => {
    collapsed = !collapsed
    render()
  })
  header.append(title, collapseButton)
  setupPanelDrag(header, panel)

  const body = document.createElement('div')
  body.className = 'bft-body'

  const controlStack = document.createElement('div')
  controlStack.className = 'bft-control-stack'

  const status = document.createElement('div')
  status.className = 'bft-status'
  const current = getCurrentExercise()
  const statusTitle = document.createElement('strong')
  statusTitle.textContent = getStatusText()
  const statusDetail = document.createElement('span')
  statusDetail.className = 'bft-muted'
  statusDetail.textContent = current
    ? `${current.name} · ${formatTimestamp(current.start)}-${formatTimestamp(current.end)} · ${current.minReps}${current.maxReps === current.minReps ? '' : `-${current.maxReps}`} 次`
    : `${exercises.length} 个动作`
  const saveStatus = document.createElement('span')
  saveStatus.className = 'bft-muted'
  saveStatus.textContent = saveStatusText
  status.append(statusTitle, statusDetail, saveStatus)

  const textarea = document.createElement('textarea')
  textarea.className = 'bft-input'
  textarea.placeholder = '俯卧撑 00:12-00:28 3x8-12 rest45'
  textarea.value = rawInput
  textarea.addEventListener('input', () => {
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    rawInput = textarea.value
    runtime.mode = runtime.mode === 'complete' ? 'idle' : runtime.mode
    savePlan()
    render({
      restoreTextarea: {
        selectionStart,
        selectionEnd,
      },
    })
  })

  const onlineImportButton = createButton('在线导入', () => {
    void importPlanFromOnline()
  })
  onlineImportButton.disabled = onlineImportBusy
  const saveButton = createButton('保存', () => {
    savePlan('已手动保存')
    render()
  }, 'bft-primary')
  const insertGroup = createToolGroup('时间', [
    createButton('插入开始', () => insertCurrentTime('start')),
    createButton('插入结束', () => insertCurrentTime('end')),
  ])
  const templateGroup = createToolGroup('模板', [
    createButton('示例', () => {
      rawInput =
        '俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60'
      savePlan()
      render()
    }),
  ])
  const fileGroup = createToolGroup('数据', [
    createButton('导出', exportPlan),
    createButton('导入', openImportPicker),
    onlineImportButton,
    saveButton,
  ])

  const settingsRow = document.createElement('div')
  settingsRow.className = 'bft-row'
  const beepLabel = document.createElement('label')
  beepLabel.className = 'bft-row'
  const beepText = document.createElement('span')
  beepText.textContent = '提示音'
  const beepSelect = document.createElement('select')
  beepSelect.className = 'bft-select'
  ;[1, 2, 3, 5].forEach(value => {
    const option = document.createElement('option')
    option.value = String(value)
    option.textContent = `${value}s`
    option.selected = settings.beepDuration === value
    beepSelect.append(option)
  })
  beepSelect.addEventListener('change', () => {
    settings.beepDuration = Number(beepSelect.value)
    savePlan()
  })
  beepLabel.append(beepText, beepSelect)

  const pauseLabel = document.createElement('label')
  pauseLabel.className = 'bft-check'
  const pauseInput = document.createElement('input')
  pauseInput.type = 'checkbox'
  pauseInput.checked = settings.pauseDuringRest
  pauseInput.addEventListener('change', () => {
    settings.pauseDuringRest = pauseInput.checked
    savePlan()
  })
  pauseLabel.append(pauseInput, document.createTextNode('休息暂停视频'))
  settingsRow.append(beepLabel, pauseLabel)

  const startPickerRow = document.createElement('div')
  startPickerRow.className = 'bft-row'
  const startPickerLabel = document.createElement('label')
  startPickerLabel.className = 'bft-row bft-grow'
  const startPickerText = document.createElement('span')
  startPickerText.textContent = '从动作'
  const startPicker = document.createElement('select')
  startPicker.className = 'bft-select bft-grow'
  startPicker.disabled = exercises.length === 0 || (runtime.mode !== 'idle' && runtime.mode !== 'complete')
  exercises.forEach((exercise, index) => {
    const option = document.createElement('option')
    option.value = String(index)
    option.textContent = `${index + 1}. ${exercise.name}`
    option.selected = index === selectedStartIndex
    startPicker.append(option)
  })
  startPicker.addEventListener('change', () => {
    selectedStartIndex = Number(startPicker.value)
    if (runtime.mode === 'idle') {
      runtime.exerciseIndex = selectedStartIndex
      runtime.setIndex = 0
    }
    render()
  })
  startPickerLabel.append(startPickerText, startPicker)
  startPickerRow.append(startPickerLabel)

  const controls = document.createElement('div')
  controls.className = 'bft-row bft-control-row'
  const startButton = createButton('开始训练', startTraining, 'bft-primary')
  startButton.disabled = exercises.length === 0
  const completeButton = createButton('完成本组', completeSet, 'bft-primary')
  completeButton.classList.add('bft-complete-button')
  completeButton.disabled = runtime.mode !== 'exercise'
  const skipButton = createButton('跳过休息', () => skipRest(false))
  skipButton.disabled = runtime.mode !== 'rest'
  const pauseButton = createButton(runtime.mode === 'paused' ? '继续' : '暂停', togglePause)
  pauseButton.disabled = runtime.mode === 'idle' || runtime.mode === 'complete'
  const resetButton = createButton('重置', () => {
    clearRestTimer()
    runtime = {
      mode: 'idle',
      exerciseIndex: selectedStartIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: 'idle',
    }
    video?.pause()
    render()
  }, 'bft-danger')
  controls.append(startButton, skipButton, pauseButton, resetButton)
  const completeRow = document.createElement('div')
  completeRow.className = 'bft-complete-row'
  completeRow.append(completeButton)

  const list = document.createElement('ul')
  list.className = 'bft-list'
  exercises.forEach((exercise, index) => {
    const itemWrapper = document.createElement('li')
    const item = document.createElement('button')
    item.type = 'button'
    item.className = [
      'bft-item',
      index === runtime.exerciseIndex && runtime.mode !== 'idle' ? 'bft-item-active' : '',
      index === selectedStartIndex ? 'bft-item-selected' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const canSwitchItem =
      runtime.mode === 'idle' || runtime.mode === 'complete' || !previewLocked
    item.disabled = !canSwitchItem
    item.addEventListener('click', () => {
      switchToExercise(index)
    })
    const name = document.createElement('strong')
    name.textContent = exercise.name
    const meta = document.createElement('span')
    meta.className = 'bft-muted'
    meta.textContent = `${formatTimestamp(exercise.start)}-${formatTimestamp(exercise.end)} · ${exercise.sets} 组 · ${exercise.minReps}${exercise.maxReps === exercise.minReps ? '' : `-${exercise.maxReps}`} 次 · 休息 ${exercise.restSeconds}s`
    item.append(name, meta)
    itemWrapper.append(item)
    list.append(itemWrapper)
  })

  if (exercises.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'bft-empty'
    empty.textContent = '暂无有效动作'
    list.append(empty)
  }

  controlStack.append(status, settingsRow, startPickerRow, controls, completeRow)

  const inputChildren: Node[] = [textarea, insertGroup, templateGroup, fileGroup]

  if (parseResult.errors.length > 0) {
    const errorBox = document.createElement('div')
    errorBox.className = 'bft-error'
    parseResult.errors.forEach(error => {
      const line = document.createElement('span')
      line.textContent = error
      errorBox.append(line)
    })
    inputChildren.push(errorBox)
  }

  const mainGrid = document.createElement('div')
  mainGrid.className = 'bft-main-grid'
  const mainLeft = document.createElement('div')
  mainLeft.className = 'bft-main-left'
  const mainRight = document.createElement('div')
  mainRight.className = 'bft-main-right'

  mainLeft.append(controlStack)
  mainRight.append(
    createSection('数据录入', inputCollapsed, () => {
      inputCollapsed = !inputCollapsed
      savePreferences()
      render()
    }, inputChildren),
    createSection('数据管理', managerCollapsed, () => {
      managerCollapsed = !managerCollapsed
      savePreferences()
      render()
    }, [createGroupActions(), createPlanInfoForm(), createManagerList()]),
    createSection(`动作预览 · ${exercises.length}`, previewCollapsed, () => {
      previewCollapsed = !previewCollapsed
      savePreferences()
      render()
    }, [list], [
      createButton(previewLocked ? '解锁' : '锁定', () => {
        previewLocked = !previewLocked
        savePreferences()
        render()
      }),
    ]),
  )
  mainGrid.append(mainLeft, mainRight)
  body.append(mainGrid)
  panel.append(header, body)
  applyPanelPosition(panel)

  if (options.restoreTextarea && !inputCollapsed) {
    textarea.focus()
    textarea.setSelectionRange(
      options.restoreTextarea.selectionStart,
      options.restoreTextarea.selectionEnd,
    )
  }
}

function insertCurrentTime(kind: 'start' | 'end'): void {
  const timestamp = formatTimestamp(video?.currentTime ?? 0)
  const line = kind === 'start' ? `动作 ${timestamp}-` : `${timestamp} 3x8-12 rest45`
  rawInput = rawInput ? `${rawInput.trimEnd()}${kind === 'start' ? '\n' : ''}${line}` : line
  savePlan()
  render()
}

function resetRuntime(): void {
  runtime = {
    mode: 'idle',
    exerciseIndex: selectedStartIndex,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: 'idle',
  }
}

function teardownPanel(): void {
  clearRestTimer()
  document.getElementById(panelId)?.remove()
  activeStorageKey = ''
  activeGroupId = ''
  planGroups = []
  video = null
  resetRuntime()
}

function setupNavigationWatcher(): void {
  if (navigationWatcherId !== undefined) {
    return
  }

  navigationWatcherId = window.setInterval(() => {
    const bvid = getCurrentBvid()
    if (!bvid) {
      if (document.getElementById(panelId)) {
        teardownPanel()
      }
      return
    }

    const key = getStorageKey()
    if (!document.getElementById(panelId)) {
      void init()
      return
    }
    if (key === activeStorageKey || navigationReloadInProgress) {
      return
    }

    void (async () => {
      navigationReloadInProgress = true
      try {
        const nextVideo = document.querySelector<HTMLVideoElement>('video') ?? (await waitForVideo(5000))
        if (!nextVideo) {
          teardownPanel()
          return
        }

        activeStorageKey = key
        const plan = loadPlan()
        applyPlanGroup(plan, planGroups)
        video = nextVideo
        setLoopGuard(video)
        render()
      } finally {
        navigationReloadInProgress = false
      }
    })()
  }, 1000)
}

function setupViewportWatcher(): void {
  if (viewportWatcherReady) {
    return
  }
  viewportWatcherReady = true
  window.addEventListener('resize', () => {
    const panel = document.getElementById(panelId)
    if (!panel) {
      return
    }
    applyPanelPosition(panel)
    if (!isMobileViewport()) {
      savePreferences()
    }
  })
}

async function init(): Promise<void> {
  if (initInProgress || document.getElementById(panelId)) {
    return
  }
  if (!getCurrentBvid()) {
    return
  }

  initInProgress = true
  try {
    const nextVideo = await waitForVideo()
    if (!nextVideo || !getCurrentBvid()) {
      return
    }

    activeStorageKey = getStorageKey()
    const plan = loadPlan()
    const preferences = loadPreferences()
    applyPlanGroup(plan, planGroups)
    inputCollapsed = preferences.inputCollapsed
    previewCollapsed = preferences.previewCollapsed
    managerCollapsed = preferences.managerCollapsed
    previewLocked = preferences.previewLocked
    panelPosition = preferences.panelPosition
    video = nextVideo
    injectStyle()
    setLoopGuard(video)
    render()
  } finally {
    initInProgress = false
  }
}

setupNavigationWatcher()
setupViewportWatcher()
void init()
