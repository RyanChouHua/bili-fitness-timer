import type { Exercise, Runtime } from './model'

function normalizeExerciseIndex(exercises: Exercise[], exerciseIndex: number): number {
  if (exercises.length === 0) {
    return 0
  }

  const safeIndex = Number.isFinite(exerciseIndex) ? Math.trunc(exerciseIndex) : 0
  return Math.min(Math.max(safeIndex, 0), exercises.length - 1)
}

export function createIdleRuntime(exerciseIndex = 0): Runtime {
  const safeIndex = Number.isFinite(exerciseIndex) ? Math.max(0, Math.trunc(exerciseIndex)) : 0
  return {
    mode: 'idle',
    exerciseIndex: safeIndex,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: 'idle',
  }
}

export function startTraining(exercises: Exercise[], exerciseIndex = 0): Runtime {
  if (exercises.length === 0) {
    return createIdleRuntime(exerciseIndex)
  }

  return {
    mode: 'exercise',
    exerciseIndex: normalizeExerciseIndex(exercises, exerciseIndex),
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: 'exercise',
  }
}

export function hasNextUnit(exercises: Exercise[], runtime: Runtime): boolean {
  const exercise = exercises[runtime.exerciseIndex]
  if (!exercise) {
    return false
  }

  return runtime.setIndex + 1 < exercise.sets || runtime.exerciseIndex + 1 < exercises.length
}

export function completeSet(exercises: Exercise[], runtime: Runtime): Runtime {
  if (runtime.mode !== 'exercise') {
    return { ...runtime }
  }

  const exercise = exercises[runtime.exerciseIndex]
  if (!exercise || !hasNextUnit(exercises, runtime)) {
    return {
      ...runtime,
      mode: 'complete',
      restRemaining: 0,
      beforePauseMode: 'complete',
    }
  }

  return {
    ...runtime,
    mode: 'rest',
    restRemaining: exercise.restSeconds,
    beforePauseMode: 'rest',
  }
}

export function moveToNextUnit(exercises: Exercise[], runtime: Runtime): Runtime {
  const exercise = exercises[runtime.exerciseIndex]
  if (!exercise) {
    return {
      ...runtime,
      mode: 'complete',
      restRemaining: 0,
      beforePauseMode: 'complete',
    }
  }

  if (runtime.setIndex + 1 < exercise.sets) {
    return {
      ...runtime,
      mode: 'exercise',
      setIndex: runtime.setIndex + 1,
      restRemaining: 0,
      beforePauseMode: 'exercise',
    }
  }

  if (runtime.exerciseIndex + 1 < exercises.length) {
    return {
      ...runtime,
      mode: 'exercise',
      exerciseIndex: runtime.exerciseIndex + 1,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: 'exercise',
    }
  }

  return {
    ...runtime,
    mode: 'complete',
    restRemaining: 0,
    beforePauseMode: 'complete',
  }
}

export function tickRest(exercises: Exercise[], runtime: Runtime): Runtime {
  if (runtime.mode !== 'rest') {
    return { ...runtime }
  }

  const restRemaining = Math.max(0, runtime.restRemaining - 1)
  if (restRemaining > 0) {
    return { ...runtime, restRemaining }
  }

  return moveToNextUnit(exercises, { ...runtime, restRemaining: 0 })
}

export function skipRest(exercises: Exercise[], runtime: Runtime): Runtime {
  if (runtime.mode !== 'rest') {
    return { ...runtime }
  }

  return moveToNextUnit(exercises, runtime)
}

export function pauseRuntime(runtime: Runtime): Runtime {
  if (runtime.mode !== 'exercise' && runtime.mode !== 'rest') {
    return { ...runtime }
  }

  return {
    ...runtime,
    mode: 'paused',
    beforePauseMode: runtime.mode,
  }
}

export function resumeRuntime(runtime: Runtime): Runtime {
  if (runtime.mode !== 'paused') {
    return { ...runtime }
  }

  return {
    ...runtime,
    mode: runtime.beforePauseMode,
  }
}

export function resetRuntime(exerciseIndex = 0): Runtime {
  return createIdleRuntime(exerciseIndex)
}

export function switchToExercise(
  exercises: Exercise[],
  runtime: Runtime,
  exerciseIndex: number,
): Runtime {
  if (!Number.isInteger(exerciseIndex) || !exercises[exerciseIndex]) {
    return { ...runtime }
  }

  if (runtime.mode === 'paused') {
    return {
      ...runtime,
      exerciseIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: 'exercise',
    }
  }

  const mode =
    runtime.mode === 'exercise' || runtime.mode === 'rest'
      ? 'exercise'
      : runtime.mode === 'complete'
        ? 'idle'
        : runtime.mode

  return {
    ...runtime,
    mode,
    exerciseIndex,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: mode,
  }
}
