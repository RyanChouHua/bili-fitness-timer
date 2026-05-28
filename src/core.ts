export interface Exercise {
  id: string
  name: string
  start: number
  end: number
  sets: number
  minReps: number
  maxReps: number
  restSeconds: number
}

export interface ParseResult {
  exercises: Exercise[]
  errors: string[]
}

export interface ImportedPlanData {
  bvid: string | null
  title: string | null
  rawInput: string
  exercises: Exercise[]
}

export interface SavedPlanSummary {
  storageKey: string
  storageId: string
  bvid: string | null
  title: string
  actionCount: number
  updatedAt: number | null
}

export const planStoragePrefix = 'bili-fitness-timer:'
export const defaultPreferencesStorageKey = `${planStoragePrefix}preferences`
export const timestampLibraryBaseUrl =
  'https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps'

export const timestampPattern =
  String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?|(?:(?:\d+\s*时)?(?:\d+\s*分)?\d+(?:\.\d+)?\s*秒|(?:\d+\s*时)?\d+\s*分(?:\s*\d+(?:\.\d+)?\s*秒)?)`

const bvidPattern = /BV[0-9A-Za-z]{10}/i

export function isBilibiliUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'bilibili.com' || parsed.hostname.endsWith('.bilibili.com')
  } catch {
    return false
  }
}

export function normalizeBvid(value: string): string | null {
  const match = value.match(bvidPattern)
  if (!match) {
    return null
  }
  return `BV${match[0].slice(2)}`
}

export function extractBvidFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!isBilibiliUrl(url)) {
      return null
    }

    for (const [key, value] of parsed.searchParams) {
      if (key.toLowerCase() === 'bvid' || key.toLowerCase() === 'bv_id') {
        const fromQuery = normalizeBvid(value)
        if (fromQuery) {
          return fromQuery
        }
      }
    }

    return normalizeBvid(`${parsed.pathname}${parsed.search}${parsed.hash}`)
  } catch {
    return normalizeBvid(url)
  }
}

export function getTimestampLibraryUrl(bvid: string): string {
  return `${timestampLibraryBaseUrl}/${encodeURIComponent(bvid)}.json`
}

export function getPlanStorageKey(id: string): string {
  return `${planStoragePrefix}${id}`
}

export function isPlanStorageKey(
  key: string,
  preferencesStorageKey = defaultPreferencesStorageKey,
): boolean {
  return key.startsWith(planStoragePrefix) && key !== preferencesStorageKey
}

export function booleanPreference(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function parseTimestamp(value: string): number | null {
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

export function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safeSeconds / 3600)
  const m = Math.floor((safeSeconds % 3600) / 60)
  const s = safeSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parsePlan(input: string): ParseResult {
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

export function serializeExercises(items: Exercise[]): string {
  return items
    .map(
      exercise =>
        `${exercise.name} ${formatTimestamp(exercise.start)}-${formatTimestamp(exercise.end)} ${exercise.sets}x${exercise.minReps}${exercise.maxReps === exercise.minReps ? '' : `-${exercise.maxReps}`} rest${exercise.restSeconds}`,
    )
    .join('\n')
}

export function normalizeExercise(value: unknown, index = 0): Exercise | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const exercise = value as Partial<Exercise>
  const id =
    typeof exercise.id === 'string'
      ? exercise.id
      : `${index}-${Number(exercise.start)}-${Number(exercise.end)}`

  if (
    typeof exercise.name !== 'string' ||
    typeof exercise.start !== 'number' ||
    typeof exercise.end !== 'number' ||
    typeof exercise.sets !== 'number' ||
    typeof exercise.minReps !== 'number' ||
    typeof exercise.maxReps !== 'number' ||
    typeof exercise.restSeconds !== 'number'
  ) {
    return null
  }

  if (
    !Number.isFinite(exercise.start) ||
    !Number.isFinite(exercise.end) ||
    !Number.isFinite(exercise.sets) ||
    !Number.isFinite(exercise.minReps) ||
    !Number.isFinite(exercise.maxReps) ||
    !Number.isFinite(exercise.restSeconds) ||
    exercise.end <= exercise.start ||
    exercise.sets <= 0 ||
    exercise.minReps <= 0 ||
    exercise.maxReps < exercise.minReps ||
    exercise.restSeconds < 0
  ) {
    return null
  }

  return {
    id,
    name: exercise.name,
    start: exercise.start,
    end: exercise.end,
    sets: exercise.sets,
    minReps: exercise.minReps,
    maxReps: exercise.maxReps,
    restSeconds: exercise.restSeconds,
  }
}

export function normalizeExerciseList(value: unknown): Exercise[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => normalizeExercise(item, index))
    .filter((item): item is Exercise => item !== null)
}

export function normalizeImportedPlanData(value: unknown): ImportedPlanData {
  if (!value || typeof value !== 'object') {
    throw new Error('JSON 必须是对象')
  }

  const payload = value as {
    bvid?: unknown
    title?: unknown
    rawInput?: unknown
    exercises?: unknown
    savedExercises?: unknown
  }
  const exercises = normalizeExerciseList(payload.exercises)
  const savedExercises = normalizeExerciseList(payload.savedExercises)
  const importedExercises = exercises.length > 0 ? exercises : savedExercises
  const rawInput =
    typeof payload.rawInput === 'string' && payload.rawInput.trim()
      ? payload.rawInput
      : serializeExercises(importedExercises)

  if (!rawInput.trim() && importedExercises.length === 0) {
    throw new Error('JSON 缺少 rawInput 或 exercises')
  }

  return {
    bvid: typeof payload.bvid === 'string' ? normalizeBvid(payload.bvid) : null,
    title:
      typeof payload.title === 'string' && payload.title.trim()
        ? payload.title.trim()
        : null,
    rawInput,
    exercises: importedExercises,
  }
}

export function summarizeStoredPlan(storageKey: string, storedValue: string): SavedPlanSummary | null {
  try {
    const parsed = JSON.parse(storedValue) as {
      bvid?: unknown
      title?: unknown
      rawInput?: unknown
      savedExercises?: unknown
      updatedAt?: unknown
    }
    const storageId = storageKey.startsWith(planStoragePrefix)
      ? storageKey.slice(planStoragePrefix.length)
      : storageKey
    const savedExercises = normalizeExerciseList(parsed.savedExercises)
    const rawInput =
      typeof parsed.rawInput === 'string'
        ? parsed.rawInput
        : serializeExercises(savedExercises)
    const parsedFromInput = savedExercises.length > 0 ? savedExercises : parsePlan(rawInput).exercises

    if (!rawInput.trim() && parsedFromInput.length === 0) {
      return null
    }

    const bvid =
      typeof parsed.bvid === 'string'
        ? normalizeBvid(parsed.bvid)
        : normalizeBvid(storageId)
    const title =
      typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim()
        : bvid ?? storageId
    const updatedAt =
      typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : null

    return {
      storageKey,
      storageId,
      bvid,
      title,
      actionCount: parsedFromInput.length,
      updatedAt,
    }
  } catch {
    return null
  }
}
