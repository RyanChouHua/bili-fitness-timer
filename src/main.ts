type Mode = 'idle' | 'exercise' | 'rest' | 'paused' | 'complete'

interface Exercise {
  id: string
  name: string
  start: number
  end: number
  sets: number
  minReps: number
  maxReps: number
  restSeconds: number
}

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
  rawInput: string
  settings: Settings
}

interface PanelPosition {
  left: number
  top: number
}

interface Preferences {
  panelPosition: PanelPosition | null
}

interface ParseResult {
  exercises: Exercise[]
  errors: string[]
}

const panelId = 'bili-fitness-timer-panel'
const styleId = 'bili-fitness-timer-style'
const preferencesStorageKey = 'bili-fitness-timer:preferences'
const defaultSettings: Settings = {
  beepDuration: 2,
  pauseDuringRest: true,
}
const timestampPattern =
  String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?|(?:(?:\d+\s*时)?(?:\d+\s*分)?\d+(?:\.\d+)?\s*秒|(?:\d+\s*时)?\d+\s*分(?:\s*\d+(?:\.\d+)?\s*秒)?)`

let video: HTMLVideoElement | null = null
let exercises: Exercise[] = []
let rawInput = ''
let settings: Settings = { ...defaultSettings }
let collapsed = false
let selectedStartIndex = 0
let panelPosition: PanelPosition | null = null
let runtime: Runtime = {
  mode: 'idle',
  exerciseIndex: 0,
  setIndex: 0,
  restRemaining: 0,
  beforePauseMode: 'idle',
}

let restTimerId: number | undefined
let activeStorageKey = ''

interface RenderOptions {
  restoreTextarea?: {
    selectionStart: number
    selectionEnd: number
  }
}

function getStorageKey(): string {
  const bvid = location.pathname.match(/\/video\/(BV[\w]+)/)?.[1]
  return `bili-fitness-timer:${bvid ?? location.pathname}`
}

function loadPlan(): StoredPlan {
  const fallback: StoredPlan = {
    rawInput: '',
    settings: { ...defaultSettings },
  }

  try {
    const saved = localStorage.getItem(getStorageKey())
    if (!saved) {
      return fallback
    }
    const parsed = JSON.parse(saved) as Partial<StoredPlan>
    return {
      rawInput: typeof parsed.rawInput === 'string' ? parsed.rawInput : '',
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
    }
  } catch {
    return fallback
  }
}

function savePlan(): void {
  localStorage.setItem(
    getStorageKey(),
    JSON.stringify({
      rawInput,
      settings,
    } satisfies StoredPlan),
  )
}

function loadPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(preferencesStorageKey)
    if (!saved) {
      return { panelPosition: null }
    }

    const parsed = JSON.parse(saved) as Partial<Preferences>
    const position = parsed.panelPosition
    if (
      position &&
      typeof position.left === 'number' &&
      typeof position.top === 'number'
    ) {
      return {
        panelPosition: {
          left: position.left,
          top: position.top,
        },
      }
    }
  } catch {
    return { panelPosition: null }
  }

  return { panelPosition: null }
}

function savePreferences(): void {
  localStorage.setItem(
    preferencesStorageKey,
    JSON.stringify({
      panelPosition,
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
  const payload: StoredPlan = {
    rawInput,
    settings,
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

async function importPlanFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<StoredPlan>
  if (typeof parsed.rawInput !== 'string') {
    throw new Error('Invalid plan file')
  }

  rawInput = parsed.rawInput
  settings = {
    beepDuration:
      typeof parsed.settings?.beepDuration === 'number'
        ? parsed.settings.beepDuration
        : settings.beepDuration,
    pauseDuringRest:
      typeof parsed.settings?.pauseDuringRest === 'boolean'
        ? parsed.settings.pauseDuringRest
        : settings.pauseDuringRest,
  }
  selectedStartIndex = 0
  runtime = {
    mode: 'idle',
    exerciseIndex: 0,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: 'idle',
  }
  savePlan()
  render()
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

function parseTimestamp(value: string): number | null {
  const text = value.trim()
  const chinese = text.match(/^(?:(\d+)\s*时)?(?:(\d+)\s*分)?(?:(\d+(?:\.\d+)?)\s*秒?)$/)
  if (chinese && (chinese[1] || chinese[2] || chinese[3])) {
    return (
      Number(chinese[1] ?? 0) * 3600 +
      Number(chinese[2] ?? 0) * 60 +
      Number(chinese[3] ?? 0)
    )
  }

  const parts = text.split(':')
  if (parts.length < 2 || parts.length > 3) {
    return null
  }
  if (parts.some(part => part.trim() === '' || Number.isNaN(Number(part)))) {
    return null
  }

  const numbers = parts.map(Number)
  if (numbers.length === 2) {
    return numbers[0] * 60 + numbers[1]
  }
  return numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
}

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safeSeconds / 3600)
  const m = Math.floor((safeSeconds % 3600) / 60)
  const s = safeSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function parsePlan(input: string): ParseResult {
  const errors: string[] = []
  const parsedExercises: Exercise[] = []
  const lines = input.split(/\r?\n/)

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) {
      return
    }

    const timeMatch = line.match(
      new RegExp(`(?<start>${timestampPattern})\\s*(?:-|~|至|到)\\s*(?<end>${timestampPattern})`),
    )
    const setMatch = line.match(/(?<sets>\d+)\s*(?:x|X|×|组)\s*(?<min>\d+)(?:\s*[-~]\s*(?<max>\d+))?/)
    const restMatch = line.match(/(?:rest|休息)\s*(?<rest>\d+)/i)

    if (!timeMatch?.groups) {
      errors.push(`第 ${index + 1} 行：缺少时间段，例如 00:12-00:28`)
      return
    }
    if (!setMatch?.groups) {
      errors.push(`第 ${index + 1} 行：缺少组数和次数，例如 3x8-12`)
      return
    }

    const start = parseTimestamp(timeMatch.groups.start)
    const end = parseTimestamp(timeMatch.groups.end)
    if (start === null || end === null) {
      errors.push(`第 ${index + 1} 行：时间戳格式无法识别`)
      return
    }
    if (end <= start) {
      errors.push(`第 ${index + 1} 行：结束时间必须晚于开始时间`)
      return
    }

    const beforeTime = line.slice(0, timeMatch.index).trim()
    const name = beforeTime || `动作 ${parsedExercises.length + 1}`
    const sets = Number(setMatch.groups.sets)
    const minReps = Number(setMatch.groups.min)
    const maxReps = Number(setMatch.groups.max ?? setMatch.groups.min)
    const restSeconds = restMatch?.groups ? Number(restMatch.groups.rest) : 45

    if (sets <= 0 || minReps <= 0 || maxReps < minReps || restSeconds < 0) {
      errors.push(`第 ${index + 1} 行：组数、次数或休息时间无效`)
      return
    }

    parsedExercises.push({
      id: `${index}-${start}-${end}`,
      name,
      start,
      end,
      sets,
      minReps,
      maxReps,
      restSeconds,
    })
  })

  return {
    exercises: parsedExercises,
    errors,
  }
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

function setLoopGuard(): void {
  video?.addEventListener('timeupdate', () => {
    if (!video || runtime.mode !== 'exercise') {
      return
    }
    const exercise = getCurrentExercise()
    if (!exercise) {
      return
    }
    if (video.currentTime >= exercise.end || video.currentTime < exercise.start - 0.25) {
      video.currentTime = exercise.start
      if (video.paused) {
        void video.play()
      }
    }
  })
}

function waitForVideo(): Promise<HTMLVideoElement> {
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
      right: 18px;
      top: 96px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
      max-height: calc(100vh - 128px);
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
      gap: 8px;
      padding: 10px 12px;
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
      gap: 10px;
      padding: 12px;
      max-height: calc(100vh - 180px);
      overflow: auto;
    }
    .bft-collapsed .bft-body {
      display: none;
    }
    .bft-status {
      display: grid;
      gap: 4px;
      padding: 9px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 6px;
    }
    .bft-muted {
      color: rgba(246, 247, 249, 0.68);
    }
    .bft-row {
      display: flex;
      align-items: center;
      gap: 8px;
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
      min-height: 116px;
      resize: vertical;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 9px;
      outline: none;
    }
    .bft-input:focus,
    .bft-select:focus {
      border-color: #4cc9a7;
    }
    .bft-button {
      min-height: 30px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      color: #f6f7f9;
      background: rgba(255, 255, 255, 0.1);
      padding: 5px 9px;
      cursor: pointer;
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
      min-height: 30px;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 4px 7px;
    }
    .bft-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(246, 247, 249, 0.82);
    }
    .bft-list {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bft-item {
      display: grid;
      gap: 2px;
      width: 100%;
      color: inherit;
      text-align: left;
      cursor: pointer;
      padding: 7px 8px;
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
        left: 8px;
        right: 8px;
        top: auto;
        bottom: max(8px, env(safe-area-inset-bottom));
        width: auto;
        max-height: min(68vh, 520px);
        border-radius: 8px 8px 0 0;
      }
      .bft-header {
        cursor: default;
        touch-action: auto;
      }
      .bft-body {
        gap: 8px;
        padding: 10px;
        max-height: calc(min(68vh, 520px) - 48px);
      }
      .bft-input {
        min-height: 88px;
      }
      .bft-button,
      .bft-select {
        min-height: 36px;
      }
      .bft-row {
        gap: 6px;
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
  exercises = parseResult.exercises
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
  status.append(statusTitle, statusDetail)

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

  const timeButtons = document.createElement('div')
  timeButtons.className = 'bft-row'
  timeButtons.append(
    createButton('插入开始', () => insertCurrentTime('start')),
    createButton('插入结束', () => insertCurrentTime('end')),
    createButton('示例', () => {
      rawInput =
        '俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60'
      savePlan()
      render()
    }),
    createButton('导出', exportPlan),
    createButton('导入', openImportPicker),
  )

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
  startPicker.disabled = exercises.length === 0 || runtime.mode !== 'idle'
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
  controls.className = 'bft-row'
  const startButton = createButton('开始训练', startTraining, 'bft-primary')
  startButton.disabled = exercises.length === 0
  const completeButton = createButton('完成本组', completeSet, 'bft-primary')
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
  controls.append(startButton, completeButton, skipButton, pauseButton, resetButton)

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
    item.disabled = runtime.mode !== 'idle' && runtime.mode !== 'complete'
    item.addEventListener('click', () => {
      selectedStartIndex = index
      runtime.exerciseIndex = index
      runtime.setIndex = 0
      if (video) {
        video.currentTime = exercise.start
      }
      if (runtime.mode === 'complete') {
        runtime.mode = 'idle'
      }
      render()
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

  body.append(status, textarea, timeButtons, settingsRow, startPickerRow, controls)

  if (parseResult.errors.length > 0) {
    const errorBox = document.createElement('div')
    errorBox.className = 'bft-error'
    parseResult.errors.forEach(error => {
      const line = document.createElement('span')
      line.textContent = error
      errorBox.append(line)
    })
    body.append(errorBox)
  }

  body.append(list)
  panel.append(header, body)
  applyPanelPosition(panel)

  if (options.restoreTextarea) {
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

function setupNavigationWatcher(): void {
  window.setInterval(() => {
    const key = getStorageKey()
    if (key === activeStorageKey) {
      return
    }

    activeStorageKey = key
    const plan = loadPlan()
    rawInput = plan.rawInput
    settings = plan.settings
    clearRestTimer()
    runtime = {
      mode: 'idle',
      exerciseIndex: 0,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: 'idle',
    }
    render()
  }, 1000)
}

function setupViewportWatcher(): void {
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
  if (document.getElementById(panelId)) {
    return
  }

  activeStorageKey = getStorageKey()
  const plan = loadPlan()
  const preferences = loadPreferences()
  rawInput = plan.rawInput
  settings = plan.settings
  panelPosition = preferences.panelPosition
  video = await waitForVideo()
  injectStyle()
  setLoopGuard()
  render()
  setupNavigationWatcher()
  setupViewportWatcher()
}

void init()
