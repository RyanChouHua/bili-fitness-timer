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

export interface Settings {
  beepDuration: number
  pauseDuringRest: boolean
}

export interface StoredPlan {
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

export interface StoredPlanLibrary {
  schemaVersion: 2
  bvid?: string | null
  activeGroupId: string
  groups: StoredPlan[]
  updatedAt?: number
}

export interface ImportedPlanData {
  bvid: string | null
  title: string | null
  author: string | null
  notes: string | null
  rawInput: string
  exercises: Exercise[]
  groups: ImportedPlanGroupData[]
}

export interface ImportedPlanGroupData {
  id: string | null
  title: string | null
  author: string | null
  notes: string | null
  rawInput: string
  exercises: Exercise[]
  settings: unknown
}

export interface SavedPlanSummary {
  storageKey: string
  storageId: string
  groupId: string | null
  groupCount: number
  bvid: string | null
  title: string
  author: string | null
  notes: string | null
  actionCount: number
  updatedAt: number | null
}

export type Mode = 'idle' | 'exercise' | 'rest' | 'paused' | 'complete'

export interface Runtime {
  mode: Mode
  exerciseIndex: number
  setIndex: number
  restRemaining: number
  beforePauseMode: Exclude<Mode, 'paused'>
}

export type WorkTab = 'groups' | 'preview' | 'settings'

export interface PanelPosition {
  left: number
  top: number
}

export interface PanelSize {
  width: number
  height: number
}

export interface Preferences {
  panelPosition: PanelPosition | null
  panelSize: PanelSize | null
  previewLocked: boolean
  activeTab: WorkTab
  inputCollapsed: boolean
}

export const defaultSettings: Readonly<Settings> = {
  beepDuration: 2,
  pauseDuringRest: true,
}
