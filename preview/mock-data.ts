import type { PreviewItemData, WorkoutMockData, WorkoutStatus } from '../src/ui/types'

export type SampleId = 'normal' | 'empty' | 'input-error' | 'many-groups' | 'reset-confirm'

export interface StatusOption {
  id: WorkoutStatus
  label: string
  hint: string
}

export interface SampleOption {
  id: SampleId
  label: string
  hint: string
}

export interface WidthOption {
  id: 'mobile' | 'tablet' | 'desktop'
  label: string
  width: number
  height: number
}

const planText = `深蹲 00:12-00:40 3x12 rest45
俯卧撑 00:45-01:20 3x10 rest45
登山跑 01:25-02:05 3x20 rest30
平板支撑 02:10-02:50 2x1 rest60`

const groups = [
  { id: 'mon', name: '周一动作', meta: '6 个动作 · 最近使用', progress: '6 / 6', active: true, locked: true },
  { id: 'wed', name: '周三燃脂', meta: '8 个动作 · 18 分钟', progress: '3 / 8', locked: false },
  { id: 'fri', name: '周五核心', meta: '5 个动作 · 12 分钟', progress: '0 / 5', locked: false },
  { id: 'weekend', name: '周末拉伸', meta: '7 个动作 · 16 分钟', progress: '0 / 7', locked: false },
  { id: 'draft', name: '动作草稿 A', meta: '2 个动作 · 未开始', progress: '0 / 2', locked: false },
  { id: 'strength', name: '力量循环', meta: '9 个动作 · 24 分钟', progress: '0 / 9', locked: false },
  { id: 'tabata', name: 'Tabata 训练', meta: '8 个动作 · 8 分钟', progress: '0 / 8', locked: false },
  { id: 'warmup', name: '热身流程', meta: '5 个动作 · 10 分钟', progress: '0 / 5', locked: false },
  { id: 'mobility', name: '关节活动', meta: '6 个动作 · 14 分钟', progress: '0 / 6', locked: false },
]

const queue = (status: WorkoutStatus): PreviewItemData[] => [
  { id: 'squat', name: '深蹲', time: '00:12 — 00:40', sets: '3 组', status: status === 'idle' ? 'current' : 'done' },
  { id: 'push-up', name: '俯卧撑', time: '00:45 — 01:20', sets: '3 组', status: status === 'complete' ? 'done' : status === 'idle' ? 'upcoming' : 'current', locked: status !== 'idle' },
  { id: 'climber', name: '登山跑', time: '01:25 — 02:05', sets: '3 组', status: status === 'complete' ? 'done' : 'upcoming', locked: status !== 'idle' },
  { id: 'plank', name: '平板支撑', time: '02:10 — 02:50', sets: '2 组', status: status === 'complete' ? 'done' : 'upcoming', locked: status !== 'idle' },
]

const statusData: Record<WorkoutStatus, Partial<WorkoutMockData>> = {
  idle: {
    title: '深蹲',
    statusLabel: '准备开始',
    statusNote: '从第一个动作开始，视频会循环播放动作片段。',
    phase: 'READY',
    currentSet: 1,
    totalSets: 3,
    currentExercise: 1,
    totalExercises: 4,
    restRemaining: '00:45',
    metrics: [
      { label: '当前动作', value: '1 / 4', detail: '深蹲', accent: 'pink' },
      { label: '组次', value: '1 / 3', detail: '准备开始', accent: 'teal' },
      { label: '预计时长', value: '14:20', detail: '整套计划', accent: 'amber' },
    ],
    primaryAction: { id: 'start', label: '开始训练', note: '从深蹲第 1 组开始', tone: 'primary' },
    secondaryActions: [{ id: 'pause', label: '暂停', tone: 'quiet', disabled: true }],
  },
  exercise: {
    title: '俯卧撑',
    statusLabel: '训练中',
    statusNote: '保持节奏，完成这一组后进入 45 秒休息。',
    phase: 'EXERCISE',
    currentSet: 2,
    totalSets: 3,
    currentExercise: 2,
    totalExercises: 4,
    restRemaining: '00:45',
    metrics: [
      { label: '当前动作', value: '2 / 4', detail: '俯卧撑', accent: 'teal' },
      { label: '本组', value: '2 / 3', detail: '10 次', accent: 'pink' },
      { label: '片段', value: '00:35', detail: '循环播放', accent: 'amber' },
    ],
    primaryAction: { id: 'complete-set', label: '完成本组', note: '完成后进入 45 秒休息', tone: 'primary' },
    secondaryActions: [
      { id: 'pause', label: '暂停', note: '保留当前进度', tone: 'secondary' },
      { id: 'skip-rest', label: '跳过休息', note: '仅休息中可用', tone: 'quiet', disabled: true },
    ],
  },
  rest: {
    title: '俯卧撑',
    statusLabel: '休息中',
    statusNote: '第 2 组已完成，倒计时结束后自动继续。',
    phase: 'REST',
    currentSet: 2,
    totalSets: 3,
    currentExercise: 2,
    totalExercises: 4,
    restRemaining: '00:42',
    metrics: [
      { label: '倒计时', value: '00:42', detail: '自动继续', accent: 'amber' },
      { label: '下一组', value: '3 / 3', detail: '俯卧撑', accent: 'teal' },
      { label: '已完成', value: '4 组', detail: '整套计划', accent: 'pink' },
    ],
    primaryAction: { id: 'resting', label: '休息 42s', note: '倒计时结束后自动继续', tone: 'primary', disabled: true },
    secondaryActions: [
      { id: 'pause-rest', label: '暂停', note: '暂停倒计时', tone: 'quiet' },
      { id: 'skip-rest', label: '跳过休息', note: '立即进入下一组', tone: 'secondary' },
    ],
  },
  paused: {
    title: '俯卧撑',
    statusLabel: '已暂停',
    statusNote: '训练状态与视频位置都已保留。',
    phase: 'PAUSED',
    currentSet: 2,
    totalSets: 3,
    currentExercise: 2,
    totalExercises: 4,
    restRemaining: '00:42',
    metrics: [
      { label: '当前动作', value: '2 / 4', detail: '俯卧撑', accent: 'teal' },
      { label: '组次', value: '2 / 3', detail: '进度保留', accent: 'pink' },
      { label: '状态', value: '暂停', detail: '等待继续', accent: 'amber' },
    ],
    primaryAction: { id: 'resume', label: '继续', note: '回到暂停前的训练状态', tone: 'primary' },
    secondaryActions: [{ id: 'open-workbench', label: '打开工作台', note: '训练状态不会清除', tone: 'quiet' }],
  },
  complete: {
    title: '训练完成',
    statusLabel: '已完成',
    statusNote: '全部动作与组次已经完成。',
    phase: 'COMPLETE',
    currentSet: 3,
    totalSets: 3,
    currentExercise: 4,
    totalExercises: 4,
    restRemaining: '00:00',
    metrics: [
      { label: '总时长', value: '14:08', detail: '实际用时', accent: 'teal' },
      { label: '动作', value: '4 / 4', detail: '全部完成', accent: 'pink' },
      { label: '组数', value: '11', detail: '累计完成', accent: 'amber' },
    ],
    primaryAction: { id: 'completed', label: '训练已完成', note: '可以重置后再次开始', tone: 'primary', disabled: true },
    secondaryActions: [{ id: 'review', label: '查看动作队列', tone: 'quiet' }],
  },
}

export function createMockData(status: WorkoutStatus, sample: SampleId): WorkoutMockData {
  const manyGroups = sample === 'many-groups'
  const data: WorkoutMockData = {
    scenarioId: `${status}-${sample}`,
    status,
    groupName: '周一动作',
    title: '深蹲',
    statusLabel: '准备开始',
    statusNote: '计划已就绪。',
    phase: 'READY',
    currentSet: 1,
    totalSets: 3,
    currentExercise: 1,
    totalExercises: 4,
    restRemaining: '00:45',
    metrics: [],
    primaryAction: { id: 'start', label: '开始训练', tone: 'primary' },
    secondaryActions: [],
    safety: {
      title: '重置训练',
      description: '训练中点击后需要再次确认。',
      action: { id: 'reset', label: '重置训练', tone: 'danger' },
      confirm: sample === 'reset-confirm',
    },
    previewItems: queue(status),
    entry: {
      value: planText,
      placeholder: '例如：深蹲 00:12-00:40 3x12 rest45',
      helper: '已解析 4 个动作。每行包含时间段与组数次数。',
    },
    groups: manyGroups ? groups : groups.slice(0, 4),
    groupPage: 1,
    groupPageCount: manyGroups ? 3 : 1,
    groupPageSize: 4,
    planInfo: {
      title: '14 分钟全身燃脂循环',
      author: 'Ryan',
      notes: '动作间保持呼吸稳定；膝盖不适时降低深蹲幅度。',
    },
    dataActions: {
      helper: '本地 JSON 可兼容旧版单计划；在线导入按当前 BV 查询。',
      onlineLabel: '在线导入',
    },
    settings: {
      beepDuration: 2,
      locked: status !== 'idle',
      note: status !== 'idle' ? '训练中不可切换动作' : '开始训练后锁定动作队列',
    },
    lockedPreview: status !== 'idle',
    tabCounts: { entry: '4', groups: manyGroups ? '9' : '4', preview: '4', settings: '2' },
    ...statusData[status],
  }

  if (sample === 'empty') {
    data.title = '还没有训练计划'
    data.statusLabel = '等待录入'
    data.statusNote = '打开工作台录入动作，训练舱会在这里显示队列。'
    data.currentSet = 0
    data.totalSets = 0
    data.currentExercise = 0
    data.totalExercises = 0
    data.previewItems = []
    data.entry = { value: '', placeholder: '例如：深蹲 00:12-00:40 3x12 rest45', helper: '每行一个动作；时间段和组数次数为必填。' }
    data.groups = []
    data.groupPageCount = 1
    data.metrics = [
      { label: '动作', value: '0', detail: '等待录入', accent: 'pink' },
      { label: '组数', value: '—', detail: '尚未设置', accent: 'teal' },
      { label: '时长', value: '—', detail: '录入后计算', accent: 'amber' },
    ]
    data.primaryAction = { id: 'start-empty', label: '先录入动作', note: '打开工作台填写计划', tone: 'primary', disabled: true }
  }

  if (sample === 'input-error') {
    data.entry = {
      value: `深蹲 00:12-00:40 3x12 rest45\n俯卧撑 00:45-01:20 3x10 rest45\n登山跑 01:25-02:05`,
      placeholder: '例如：深蹲 00:12-00:40 3x12 rest45',
      helper: '每行一个动作。',
      error: {
        title: '第 3 行缺少组数次数',
        message: '“登山跑”只有时间段，暂时不会加入动作队列。',
        hint: '补充为：登山跑 01:25-02:05 3x20 rest30',
      },
    }
  }

  return data
}

export const STATUS_OPTIONS: StatusOption[] = [
  { id: 'idle', label: 'idle', hint: '准备' },
  { id: 'exercise', label: 'exercise', hint: '训练中' },
  { id: 'rest', label: 'rest', hint: '倒计时' },
  { id: 'paused', label: 'paused', hint: '暂停' },
  { id: 'complete', label: 'complete', hint: '完成' },
]

export const SAMPLE_OPTIONS: SampleOption[] = [
  { id: 'normal', label: '正常计划', hint: '4 个动作' },
  { id: 'empty', label: '空动作', hint: 'idle 边界' },
  { id: 'input-error', label: '录入错误', hint: '实时提示' },
  { id: 'many-groups', label: '多分组', hint: 'pageSize 4' },
  { id: 'reset-confirm', label: '重置确认', hint: '二次确认' },
]

export const WIDTH_OPTIONS: WidthOption[] = [
  { id: 'mobile', label: '移动', width: 390, height: 844 },
  { id: 'tablet', label: '平板', width: 768, height: 1024 },
  { id: 'desktop', label: '桌面', width: 1280, height: 820 },
]
