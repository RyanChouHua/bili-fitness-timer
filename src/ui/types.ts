import type { ComponentChildren } from 'preact'

export type WorkoutStatus = 'idle' | 'exercise' | 'rest' | 'paused' | 'complete'

export type ViewMode = 'training' | 'workbench' | 'dock'

export type ActionTone = 'primary' | 'secondary' | 'quiet' | 'danger'

export interface ActionData {
  id: string
  label: string
  note?: string
  tone?: ActionTone
  disabled?: boolean
}

export interface MetricData {
  label: string
  value: string
  detail: string
  accent?: 'pink' | 'teal' | 'amber'
}

export interface EntryError {
  title: string
  message: string
  hint: string
}

export interface EntryData {
  value: string
  placeholder: string
  helper: string
  error?: EntryError
}

export interface SafetyData {
  title: string
  description: string
  action: ActionData
  confirm?: boolean
}

export interface GroupData {
  id: string
  name: string
  meta: string
  progress: string
  active?: boolean
  locked?: boolean
}

export type PreviewItemStatus = 'done' | 'current' | 'upcoming'

export interface PreviewItemData {
  id: string
  name: string
  time: string
  sets: string
  status: PreviewItemStatus
  locked?: boolean
}

export interface SettingsData {
  beepDuration: 1 | 2 | 3 | 5
  locked: boolean
  note: string
}

export interface PlanInfoData {
  title: string
  author: string
  notes: string
}

export interface DataActionsData {
  helper: string
  onlineLabel: string
}

export interface TabCounts {
  entry: string
  groups: string
  preview: string
  settings: string
}

export interface WorkoutMockData {
  scenarioId: string
  status: WorkoutStatus
  groupName: string
  title: string
  statusLabel: string
  statusNote: string
  phase: string
  currentSet: number
  totalSets: number
  currentExercise: number
  totalExercises: number
  restRemaining: string
  metrics: MetricData[]
  primaryAction: ActionData
  secondaryActions: ActionData[]
  safety?: SafetyData
  previewItems: PreviewItemData[]
  entry: EntryData
  currentTimeLabel?: string
  groups: GroupData[]
  groupPage: number
  groupPageCount: number
  groupPageSize: number
  planInfo: PlanInfoData
  dataActions: DataActionsData
  settings: SettingsData
  lockedPreview: boolean
  lastActionLabel?: string
  tabCounts: TabCounts
}

export interface FeatureSlots {
  trainingProgress?: ComponentChildren
  runtimeRecovery?: ComponentChildren
}
