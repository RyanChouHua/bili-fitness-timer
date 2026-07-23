import { useEffect, useMemo, useState } from 'preact/hooks'
import { formatTimestamp, parsePlan } from '../core/index'
import { isRuntimeSnapshotCompatible, type WorkoutStore, type StoreState, type RuntimeSnapshot } from '../state/store'
import type { ActionData, FeatureSlots, ViewMode, WorkoutMockData } from './types'
import { DockBar, PlanWorkbench, RuntimeRecoveryPrompt, TrainingDeck, TrainingProgress } from './components'

export interface AppProps {
  data: WorkoutMockData
  view?: ViewMode
  connected?: boolean
  slots?: FeatureSlots
  onViewChange?: (view: ViewMode) => void
  onAction?: (actionId: string) => void
  onGroupPageChange?: (page: number) => void
  onPlanInputChange?: (value: string) => void
  onPlanInfoChange?: (info: Partial<WorkoutMockData['planInfo']>) => void
  onBeepDurationChange?: (duration: 1 | 2 | 3 | 5) => void
}

export function App({
  data,
  view = 'training',
  connected = false,
  slots,
  onViewChange,
  onAction,
  onGroupPageChange,
  onPlanInputChange,
  onPlanInfoChange,
  onBeepDurationChange,
}: AppProps) {
  const handleAction = (action: ActionData) => {
    if (action.id.startsWith('group-page-')) {
      onGroupPageChange?.(Number(action.id.replace('group-page-', '')))
    }
    onAction?.(action.id)
  }

  return (
    <div
      className={`ui-shell ui-shell--${view}${connected ? ' ui-shell--connected' : ''}`}
      data-testid="ui-shell"
      data-view={view}
    >
      {slots?.runtimeRecovery}
      {view === 'training' && (
        <TrainingDeck data={data} trainingProgress={slots?.trainingProgress} onAction={handleAction} />
      )}
      {view === 'workbench' && (
        <PlanWorkbench
          data={data}
          readOnlyEntry={!connected}
          currentTimeLabel={data.currentTimeLabel}
          onPlanInputChange={onPlanInputChange}
          onPlanInfoChange={onPlanInfoChange}
          onBeepDurationChange={onBeepDurationChange}
          onAction={handleAction}
        />
      )}
      <DockBar view={view} groupName={data.groupName} onViewChange={onViewChange} onAction={handleAction} />
    </div>
  )
}

function formatRest(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function getExerciseCount(group: StoreState['library']['groups'][number]): number {
  if (group.savedExercises.length > 0) {
    return group.savedExercises.length
  }
  return parsePlan(group.rawInput).exercises.length
}

function getCompletedExerciseCount(state: StoreState): number {
  const total = state.exercises.length
  if (total === 0 || state.runtime.mode === 'idle') {
    return 0
  }
  if (state.runtime.mode === 'complete') {
    return total
  }

  const currentExercise = state.exercises[state.runtime.exerciseIndex]
  const completedBeforeCurrent = Math.min(state.runtime.exerciseIndex, total)
  const mode = state.runtime.mode === 'paused' ? state.runtime.beforePauseMode : state.runtime.mode
  const currentIsComplete = mode === 'rest' && currentExercise
    ? state.runtime.setIndex + 1 >= currentExercise.sets
    : false
  return Math.min(total, completedBeforeCurrent + (currentIsComplete ? 1 : 0))
}

function createConnectedData(state: StoreState): WorkoutMockData {
  const currentExercise = state.exercises[state.runtime.exerciseIndex]
  const status = state.runtime.mode
  const currentSet = currentExercise ? Math.min(state.runtime.setIndex + 1, currentExercise.sets) : 0
  const totalSets = currentExercise?.sets ?? 0
  const currentName = currentExercise?.name ?? (state.exercises.length > 0 ? '当前动作' : '还没有训练计划')
  const statusCopy: Record<StoreState['runtime']['mode'], { label: string; note: string; phase: string }> = {
    idle: {
      label: state.exercises.length > 0 ? '准备开始' : '等待录入',
      note: state.exercises.length > 0 ? '从指定动作开始，视频会循环播放动作片段。' : '打开工作台录入动作，训练舱会在这里显示队列。',
      phase: 'READY',
    },
    exercise: { label: '训练中', note: '保持节奏，完成这一组后进入休息。', phase: 'EXERCISE' },
    rest: { label: '休息中', note: '倒计时结束后自动进入下一组或下一动作。', phase: 'REST' },
    paused: { label: '已暂停', note: '训练状态与视频位置都已保留。', phase: 'PAUSED' },
    complete: { label: '已完成', note: '全部动作与组次已经完成。', phase: 'COMPLETE' },
  }
  const copy = statusCopy[status]
  const totalSetsInPlan = state.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)
  const completedSets = state.runtime.mode === 'complete'
    ? totalSetsInPlan
    : state.exercises.slice(0, state.runtime.exerciseIndex).reduce((sum, exercise) => sum + exercise.sets, 0) + state.runtime.setIndex
  const previewItems = state.exercises.map((exercise, index) => ({
    id: exercise.id,
    name: exercise.name,
    time: `${formatTimestamp(exercise.start)} — ${formatTimestamp(exercise.end)}`,
    sets: `${exercise.sets} 组`,
    status: state.runtime.mode === 'complete' || index < state.runtime.exerciseIndex
      ? 'done' as const
        : index === state.runtime.exerciseIndex
        ? 'current' as const
        : 'upcoming' as const,
    locked: state.previewLocked && status !== 'idle' && status !== 'complete',
  }))
  const lockedPreview = state.previewLocked && status !== 'idle' && status !== 'complete'

  return {
    scenarioId: `connected-${status}`,
    status,
    groupName: state.activeGroup.title ?? '当前分组',
    title: status === 'complete' ? '训练完成' : currentName,
    statusLabel: copy.label,
    statusNote: copy.note,
    phase: copy.phase,
    currentSet,
    totalSets,
    currentExercise: state.exercises.length > 0 ? state.runtime.exerciseIndex + 1 : 0,
    totalExercises: state.exercises.length,
    restRemaining: formatRest(state.runtime.restRemaining),
    currentTimeLabel: `当前视频 ${formatTimestamp(state.currentVideoTime)}`,
    metrics: [
      { label: '当前动作', value: state.exercises.length > 0 ? `${state.runtime.exerciseIndex + 1} / ${state.exercises.length}` : '0', detail: currentName, accent: 'teal' },
      { label: '组次', value: totalSets > 0 ? `${currentSet} / ${totalSets}` : '—', detail: status === 'rest' ? '倒计时中' : status === 'complete' ? '全部完成' : '当前动作', accent: 'pink' },
      { label: '总进度', value: totalSetsInPlan > 0 ? `${completedSets} / ${totalSetsInPlan}` : '—', detail: '整套计划', accent: 'amber' },
    ],
    primaryAction: status === 'idle'
      ? { id: 'start-training', label: state.exercises.length > 0 ? '开始训练' : '先录入动作', note: state.exercises.length > 0 ? `从${currentName}第 1 组开始` : '打开工作台填写计划', tone: 'primary', disabled: state.exercises.length === 0 }
      : status === 'exercise'
        ? { id: 'complete-set', label: '完成本组', note: `完成后进入 ${currentExercise?.restSeconds ?? 0} 秒休息`, tone: 'primary' }
        : status === 'rest'
          ? { id: 'resting', label: `休息 ${state.runtime.restRemaining}s`, note: '倒计时结束后自动继续', tone: 'primary', disabled: true }
          : status === 'paused'
            ? { id: 'resume', label: '继续', note: '回到暂停前的训练状态', tone: 'primary' }
            : { id: 'completed', label: '训练已完成', note: '可以重置后再次开始', tone: 'primary', disabled: true },
    secondaryActions: status === 'exercise'
      ? [{ id: 'pause', label: '暂停', note: '保留当前进度', tone: 'secondary' }]
      : status === 'rest'
        ? [{ id: 'pause-rest', label: '暂停', note: '暂停倒计时', tone: 'quiet' }, { id: 'skip-rest', label: '跳过休息', note: '立即进入下一组', tone: 'secondary' }]
        : status === 'paused'
          ? [{ id: 'open-workbench', label: '打开工作台', note: '训练状态不会清除', tone: 'quiet' }]
          : [],
    safety: state.exercises.length > 0
      ? { title: '重置训练', description: '训练中点击后需要再次确认。', action: { id: 'reset', label: '重置训练', tone: 'danger' }, confirm: state.resetConfirmation }
      : undefined,
    previewItems,
    entry: {
      value: state.rawInput,
      placeholder: '例如：深蹲 00:12-00:40 3x12 rest45',
      helper: state.parseErrors.length === 0 ? `已解析 ${state.exercises.length} 个动作。每行包含时间段与组数次数。` : '每行一个动作；时间段和组数次数为必填。',
      error: state.parseErrors[0]
        ? { title: '计划解析有误', message: state.parseErrors[0], hint: '修正后会自动更新动作队列。' }
        : undefined,
    },
    groups: state.library.groups.map(group => ({
      id: group.id,
      name: group.title ?? '未命名分组',
      meta: `${getExerciseCount(group)} 个动作`,
      progress: `${getExerciseCount(group)} 个动作`,
      active: group.id === state.activeGroupId,
      locked: status !== 'idle',
    })),
    groupPage: state.groupPage,
    groupPageCount: Math.max(1, Math.ceil(state.library.groups.length / state.groupPageSize)),
    groupPageSize: state.groupPageSize,
    planInfo: {
      title: state.activeGroup.title ?? '',
      author: state.activeGroup.author ?? '',
      notes: state.activeGroup.notes ?? '',
    },
    dataActions: { helper: '本地 JSON 与旧版单计划格式兼容；在线导入按当前 BV 查询。', onlineLabel: '在线导入' },
    settings: {
      beepDuration: state.settings.beepDuration === 1 || state.settings.beepDuration === 3 || state.settings.beepDuration === 5 ? state.settings.beepDuration : 2,
      locked: state.previewLocked,
      note: state.previewLocked ? '训练中不可切换动作' : '训练中允许切换动作',
    },
    lockedPreview,
    lastActionLabel: state.lastAction ?? undefined,
    tabCounts: { entry: String(state.exercises.length), groups: String(state.library.groups.length), preview: String(state.exercises.length), settings: '2' },
  }
}

export interface ConnectedAppProps {
  store: WorkoutStore
  slots?: FeatureSlots
}

export function ConnectedApp({ store, slots }: ConnectedAppProps) {
  const [state, setState] = useState(store.getState())
  const [recoveryCandidate, setRecoveryCandidate] = useState<RuntimeSnapshot | null>(() => {
    const initialState = store.getState()
    return isRuntimeSnapshotCompatible(initialState.runtimeSnapshot, initialState)
      ? initialState.runtimeSnapshot
      : null
  })

  useEffect(() => {
    setState(store.getState())
    const initialState = store.getState()
    setRecoveryCandidate(
      isRuntimeSnapshotCompatible(initialState.runtimeSnapshot, initialState)
        ? initialState.runtimeSnapshot
        : null,
    )
    return store.subscribe(setState)
  }, [store])

  const data = useMemo(() => createConnectedData(state), [state])
  const recoveryExercise = recoveryCandidate
    ? state.exercises[recoveryCandidate.runtime.exerciseIndex]
    : undefined
  const recoveryProgress = recoveryCandidate && recoveryExercise
    ? {
        exerciseName: recoveryExercise.name,
        currentExercise: recoveryCandidate.runtime.exerciseIndex + 1,
        totalExercises: state.exercises.length,
        currentSet: Math.min(recoveryCandidate.runtime.setIndex + 1, recoveryExercise.sets),
        totalSets: recoveryExercise.sets,
      }
    : null
  const handleAction = (actionId: string): void => {
    if (actionId === 'start-training' || actionId === 'start') store.actions.startTraining()
    else if (actionId === 'complete-set') store.actions.completeSet()
    else if (actionId === 'pause' || actionId === 'pause-rest') store.actions.pause()
    else if (actionId === 'resume') store.actions.resume()
    else if (actionId === 'skip-rest') store.actions.skipRest()
    else if (actionId === 'reset') store.actions.reset()
    else if (actionId === 'confirm-reset') store.actions.confirmReset()
    else if (actionId === 'cancel-reset') store.actions.cancelReset()
    else if (actionId === 'open-workbench') store.actions.setView('workbench')
    else if (actionId === 'close-workbench') store.actions.setView('dock')
    else if (actionId === 'insert-start' || actionId === 'insert-end') store.future.insertTimestamp(actionId === 'insert-start' ? 'start' : 'end')
    else if (actionId === 'import') store.future.importPlan()
    else if (actionId === 'export') store.future.exportPlan()
    else if (actionId === 'online-import') store.future.importOnlinePlan()
    else if (actionId.startsWith('select-')) {
      const id = actionId.slice('select-'.length)
      const index = state.exercises.findIndex(exercise => exercise.id === id)
      if (index >= 0) store.actions.switchToExercise(index)
    } else if (actionId.startsWith('switch-')) {
      store.future.switchGroup(actionId.slice('switch-'.length))
    } else if (actionId === 'new-group') store.future.createGroup()
    else if (actionId === 'copy-group') store.future.duplicateActiveGroup()
    else if (actionId.startsWith('rename-')) {
      const id = actionId.slice('rename-'.length)
      const group = state.library.groups.find(item => item.id === id)
      if (group && typeof globalThis.prompt === 'function') {
        const title = globalThis.prompt('请输入分组名称', group.title ?? '')
        if (title !== null) store.future.renameGroup(id, title)
      }
    } else if (actionId.startsWith('delete-')) {
      const id = actionId.slice('delete-'.length)
      const group = state.library.groups.find(item => item.id === id)
      if (
        group &&
        (typeof globalThis.confirm !== 'function' || globalThis.confirm(`确定删除“${group.title ?? '未命名分组'}”吗？`))
      ) {
        store.future.deleteGroup(id)
      }
    }
    else if (actionId === 'toggle-preview-lock') store.future.setPreviewLocked(!data.settings.locked)
  }

  const connectedSlots: FeatureSlots = {
    trainingProgress: (
      <>
        {slots?.trainingProgress}
        <TrainingProgress
          completedExercises={getCompletedExerciseCount(state)}
          totalExercises={state.exercises.length}
          currentExercise={state.exercises.length > 0 ? Math.min(state.runtime.exerciseIndex + 1, state.exercises.length) : 0}
        />
      </>
    ),
    runtimeRecovery: (
      <>
        {slots?.runtimeRecovery}
        {recoveryProgress && (
          <RuntimeRecoveryPrompt
            {...recoveryProgress}
            onConfirm={() => {
              if (store.future.requestRuntimeRecovery()) {
                setRecoveryCandidate(null)
              }
            }}
            onDismiss={() => {
              setRecoveryCandidate(null)
              store.actions.reset()
            }}
          />
        )}
      </>
    ),
  }

  return (
    <App
      data={data}
      view={state.view}
      connected
      slots={connectedSlots}
      onViewChange={view => store.actions.setView(view)}
      onAction={handleAction}
      onGroupPageChange={page => store.actions.setGroupPage(page)}
      onPlanInputChange={value => store.actions.setPlanInput(value)}
      onPlanInfoChange={info => store.future.setPlanInfo(info)}
      onBeepDurationChange={duration => store.actions.setSettings({ beepDuration: duration })}
    />
  )
}
