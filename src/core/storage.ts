import type {
  Exercise,
  ImportedPlanData,
  ImportedPlanGroupData,
  SavedPlanSummary,
  StoredPlan,
  StoredPlanLibrary,
} from './model'
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
import { defaultSettings } from './model.ts'
// @ts-expect-error The test runner executes TypeScript directly and needs the source extension.
import { parsePlan, serializeExercises } from './parse.ts'

export const planStoragePrefix = 'bili-fitness-timer:'
export const defaultPreferencesStorageKey = `${planStoragePrefix}preferences`
export const defaultRuntimeStorageKey = `${planStoragePrefix}session`
export const timestampLibraryBaseUrl =
  'https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/timestamps'

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
  runtimeStorageKey = defaultRuntimeStorageKey,
): boolean {
  return (
    key.startsWith(planStoragePrefix) &&
    key !== preferencesStorageKey &&
    key !== runtimeStorageKey
  )
}

export function booleanPreference(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
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

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeImportedPlanGroup(value: unknown): ImportedPlanGroupData {
  if (!value || typeof value !== 'object') {
    throw new Error('子分组必须是对象')
  }

  const payload = value as {
    id?: unknown
    title?: unknown
    author?: unknown
    notes?: unknown
    rawInput?: unknown
    exercises?: unknown
    savedExercises?: unknown
    settings?: unknown
  }
  const exercises = normalizeExerciseList(payload.exercises)
  const savedExercises = normalizeExerciseList(payload.savedExercises)
  const importedExercises = exercises.length > 0 ? exercises : savedExercises
  const rawInput =
    typeof payload.rawInput === 'string' && payload.rawInput.trim()
      ? payload.rawInput
      : serializeExercises(importedExercises)

  if (!rawInput.trim() && importedExercises.length === 0) {
    throw new Error('子分组缺少 rawInput 或 exercises')
  }

  return {
    id: normalizeOptionalText(payload.id),
    title: normalizeOptionalText(payload.title),
    author: normalizeOptionalText(payload.author),
    notes: normalizeOptionalText(payload.notes),
    rawInput,
    exercises: importedExercises,
    settings: payload.settings ?? null,
  }
}

export function normalizeImportedPlanData(value: unknown): ImportedPlanData {
  if (!value || typeof value !== 'object') {
    throw new Error('JSON 必须是对象')
  }

  const payload = value as {
    bvid?: unknown
    title?: unknown
    author?: unknown
    notes?: unknown
    groups?: unknown
  }
  const groups = Array.isArray(payload.groups)
    ? payload.groups.map((group, index) => {
        try {
          return normalizeImportedPlanGroup(group)
        } catch (error) {
          const message = error instanceof Error ? error.message : '格式错误'
          throw new Error(`第 ${index + 1} 个子分组：${message}`)
        }
      })
    : [normalizeImportedPlanGroup(value)]

  if (groups.length === 0) {
    throw new Error('JSON 缺少子分组')
  }

  const firstGroup = groups[0]

  return {
    bvid: typeof payload.bvid === 'string' ? normalizeBvid(payload.bvid) : null,
    title: normalizeOptionalText(payload.title),
    author: normalizeOptionalText(payload.author),
    notes: normalizeOptionalText(payload.notes),
    rawInput: firstGroup.rawInput,
    exercises: firstGroup.exercises,
    groups,
  }
}

export function normalizeStoredPlan(
  value: unknown,
  fallbackTitle: string,
  index = 0,
  fallbackBvid: string | null = null,
): StoredPlan | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const parsed = value as Partial<StoredPlan>
  const savedExercises = normalizeExerciseList(parsed.savedExercises)
  const id = normalizeOptionalText(parsed.id) ?? `legacy-${index + 1}`
  const title = normalizeOptionalText(parsed.title) ?? fallbackTitle

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
    bvid: typeof parsed.bvid === 'string' ? normalizeBvid(parsed.bvid) : fallbackBvid,
    title,
    author: normalizeOptionalText(parsed.author) ?? undefined,
    notes: normalizeOptionalText(parsed.notes) ?? undefined,
    createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : undefined,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
  }
}

export function createLibraryFromLegacy(
  value: unknown,
  fallbackTitle = '子分组 1',
  fallbackBvid: string | null = null,
): StoredPlanLibrary {
  const normalizedFallbackBvid = fallbackBvid ? normalizeBvid(fallbackBvid) : null
  const legacyGroup = normalizeStoredPlan(value, fallbackTitle, 0, normalizedFallbackBvid) ?? {
    id: 'legacy-1',
    rawInput: '',
    settings: { ...defaultSettings },
    savedExercises: [],
    bvid: normalizedFallbackBvid,
    title: fallbackTitle,
  }
  const bvid = normalizedFallbackBvid ?? legacyGroup.bvid ?? null

  return {
    schemaVersion: 2,
    bvid,
    activeGroupId: legacyGroup.id,
    groups: [legacyGroup],
    updatedAt: legacyGroup.updatedAt,
  }
}

export function summarizeStoredPlan(storageKey: string, storedValue: string): SavedPlanSummary | null {
  try {
    const parsed = JSON.parse(storedValue) as {
      activeGroupId?: unknown
      bvid?: unknown
      groups?: unknown
      title?: unknown
      author?: unknown
      notes?: unknown
      rawInput?: unknown
      savedExercises?: unknown
      updatedAt?: unknown
    }
    const storageId = storageKey.startsWith(planStoragePrefix)
      ? storageKey.slice(planStoragePrefix.length)
      : storageKey
    let payload: {
      id?: unknown
      bvid?: unknown
      title?: unknown
      author?: unknown
      notes?: unknown
      rawInput?: unknown
      savedExercises?: unknown
      updatedAt?: unknown
    } = parsed
    let groupId: string | null = null
    let groupCount = 1

    if (Array.isArray(parsed.groups)) {
      const groups = parsed.groups.filter(
        (item): item is typeof payload => Boolean(item) && typeof item === 'object',
      )
      groupCount = groups.length
      const activeGroupId = normalizeOptionalText(parsed.activeGroupId)
      const activeGroup =
        (activeGroupId
          ? groups.find(group => normalizeOptionalText(group.id) === activeGroupId)
          : null) ?? groups[0]
      if (!activeGroup) {
        return null
      }

      payload = activeGroup
      groupId = normalizeOptionalText(activeGroup.id)
    }

    const savedExercises = normalizeExerciseList(payload.savedExercises)
    const rawInput =
      typeof payload.rawInput === 'string'
        ? payload.rawInput
        : serializeExercises(savedExercises)
    const parsedFromInput = savedExercises.length > 0 ? savedExercises : parsePlan(rawInput).exercises

    if (!rawInput.trim() && parsedFromInput.length === 0) {
      return null
    }

    const bvid =
      typeof parsed.bvid === 'string'
        ? normalizeBvid(parsed.bvid)
        : typeof payload.bvid === 'string'
          ? normalizeBvid(payload.bvid)
          : normalizeBvid(storageId)
    const title = normalizeOptionalText(payload.title) ?? bvid ?? storageId
    const updatedAt =
      typeof payload.updatedAt === 'number' && Number.isFinite(payload.updatedAt)
        ? payload.updatedAt
        : typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : null

    return {
      storageKey,
      storageId,
      groupId,
      groupCount,
      bvid,
      title,
      author: normalizeOptionalText(payload.author),
      notes: normalizeOptionalText(payload.notes),
      actionCount: parsedFromInput.length,
      updatedAt,
    }
  } catch {
    return null
  }
}
