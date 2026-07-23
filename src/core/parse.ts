import type { Exercise, ParseResult } from './model'

const colonTimestampPattern = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?`
const chineseTimestampPattern = String.raw`(?:\d+\s*时(?:\s*\d+\s*分)?(?:(?:\s*\d+(?:\.\d+)?\s*秒)|\d+(?:\.\d+)?)?|\d+\s*分(?:(?:\s*\d+(?:\.\d+)?\s*秒)|\d+(?:\.\d+)?)?|\d+(?:\.\d+)?\s*秒)`

export const timestampPattern = `(?:${colonTimestampPattern}|${chineseTimestampPattern})`

export function parseTimestamp(value: string): number | null {
  const text = value.trim()
  const chinese = text.match(
    /^(?:(\d+)\s*时)?(?:(\d+)\s*分)?(?:(?:\s*(\d+(?:\.\d+)?)\s*秒)|(\d+(?:\.\d+)?))?$/,
  )
  if (chinese && /[时分秒]/.test(text) && (chinese[1] || chinese[2] || chinese[3] || chinese[4])) {
    return (
      Number(chinese[1] ?? 0) * 3600 +
      Number(chinese[2] ?? 0) * 60 +
      Number(chinese[3] ?? chinese[4] ?? 0)
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
    const setMatch = line.match(
      /(?<sets>\d+)\s*(?:x|X|×|组)\s*(?<min>\d+)(?:\s*[-~]\s*(?<max>\d+))?/,
    )
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
