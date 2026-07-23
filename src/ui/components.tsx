import type {
  ActionData,
  DataActionsData,
  EntryData,
  GroupData,
  MetricData,
  PlanInfoData,
  PreviewItemData,
  SafetyData,
  SettingsData,
  ViewMode,
  WorkoutMockData,
  WorkoutStatus,
} from './types'

export interface StatusHeaderProps {
  status: WorkoutStatus
  title: string
  statusLabel: string
  statusNote: string
  phase: string
  groupName?: string
  currentSet?: number
  totalSets?: number
}

export function StatusHeader({
  status,
  title,
  statusLabel,
  statusNote,
  phase,
  groupName,
  currentSet,
  totalSets,
}: StatusHeaderProps) {
  return (
    <header className={`status-header status-header--${status}`}>
      <div className="status-header__line">
        <span className="panel-kicker">BILI FITNESS / {phase}</span>
        <span className="status-pill">
          <span className="status-pill__dot" aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      <div className="status-header__copy">
        <div>
          {groupName && <p className="status-header__group">{groupName}</p>}
          <h1>{title}</h1>
        </div>
        {typeof currentSet === 'number' && typeof totalSets === 'number' && totalSets > 0 && (
          <strong className="set-counter">第 {currentSet} / {totalSets} 组</strong>
        )}
        <p>{statusNote}</p>
      </div>
    </header>
  )
}

export interface MetricsProps {
  metrics: MetricData[]
}

export function Metrics({ metrics }: MetricsProps) {
  return (
    <section className="metric-grid" aria-label="训练指标">
      {metrics.map((metric) => (
        <div className={`metric metric--${metric.accent ?? 'neutral'}`} key={metric.label}>
          <span className="metric__label">{metric.label}</span>
          <strong className="metric__value">{metric.value}</strong>
          <span className="metric__detail">{metric.detail}</span>
        </div>
      ))}
    </section>
  )
}

export interface PrimaryActionProps {
  action: ActionData
  onAction?: (action: ActionData) => void
}

export function PrimaryAction({ action, onAction }: PrimaryActionProps) {
  return (
    <section className="primary-action-block" aria-label="主要操作">
      <button
        className="primary-action"
        type="button"
        disabled={action.disabled}
        onClick={() => onAction?.(action)}
      >
        <span>{action.label}</span>
        <span className="primary-action__arrow" aria-hidden="true">→</span>
      </button>
      {action.note && <p className="primary-action__note">{action.note}</p>}
    </section>
  )
}

export interface SecondaryControlRowProps {
  actions: ActionData[]
  onAction?: (action: ActionData) => void
}

export function SecondaryControlRow({ actions, onAction }: SecondaryControlRowProps) {
  if (actions.length === 0) return null

  return (
    <section className="control-row" aria-label="次要控制">
      {actions.map((action) => (
        <button
          className={`control-button control-button--${action.tone ?? 'secondary'}`}
          type="button"
          disabled={action.disabled}
          key={action.id}
          onClick={() => onAction?.(action)}
        >
          <span>{action.label}</span>
          {action.note && <small>{action.note}</small>}
        </button>
      ))}
    </section>
  )
}

export interface SafetyActionZoneProps {
  safety?: SafetyData
  onAction?: (action: ActionData) => void
}

export function SafetyActionZone({ safety, onAction }: SafetyActionZoneProps) {
  if (!safety) return null

  return (
    <aside className={`safety-zone${safety.confirm ? ' safety-zone--confirm' : ''}`}>
      <div>
        <span className="safety-zone__label">安全操作</span>
        <strong>{safety.confirm ? '确认重置训练？' : safety.title}</strong>
        <p>{safety.confirm ? '当前训练进度会回到未开始状态。' : safety.description}</p>
      </div>
      <div className="safety-zone__actions">
        <button
          type="button"
          className="control-button control-button--danger"
          onClick={() => onAction?.(safety.confirm ? { id: 'confirm-reset', label: '确认重置', tone: 'danger' } : safety.action)}
        >
          {safety.confirm ? '确认重置' : safety.action.label}
        </button>
        {safety.confirm && (
          <button
            type="button"
            className="control-button control-button--quiet"
            onClick={() => onAction?.({ id: 'cancel-reset', label: '取消重置', tone: 'quiet' })}
          >
            取消
          </button>
        )}
      </div>
    </aside>
  )
}

export interface PreviewListProps {
  items: PreviewItemData[]
  locked?: boolean
  onAction?: (action: ActionData) => void
}

export function PreviewList({ items, locked, onAction }: PreviewListProps) {
  return (
    <section className="content-section preview-queue" aria-labelledby="preview-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">EXERCISE QUEUE</span>
          <h2 id="preview-title">动作队列</h2>
        </div>
        <span className="section-heading__count">{locked ? '训练中已锁定' : '可切换'}</span>
      </div>
      {items.length > 0 ? (
        <div className="preview-list">
          {items.map((item, index) => {
            const selectable = !locked
            const content = (
              <>
                <span className="preview-item__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="preview-item__body">
                  <strong>{item.name}</strong>
                  <small>{item.sets} · {item.time}</small>
                </span>
                <span className="preview-item__state">
                  {item.status === 'done' ? '完成' : item.status === 'current' ? '当前' : '待训练'}
                  {item.locked || locked ? ' · 锁定' : ''}
                </span>
              </>
            )

            return selectable ? (
              <button
                className={`preview-item preview-item--${item.status}`}
                type="button"
                key={item.id}
                onClick={() => onAction?.({ id: `select-${item.id}`, label: `切换到${item.name}` })}
              >
                {content}
              </button>
            ) : (
              <div className={`preview-item preview-item--${item.status}`} key={item.id} aria-current={item.status === 'current' ? 'step' : undefined}>
                {content}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state"><strong>还没有动作</strong><span>打开工作台录入一行计划后，这里会出现动作队列。</span></div>
      )}
    </section>
  )
}

export interface EntrySectionProps {
  entry: EntryData
  readOnly?: boolean
  currentTimeLabel?: string
  onValueChange?: (value: string) => void
  onAction?: (action: ActionData) => void
}

export function EntrySection({
  entry,
  readOnly = true,
  currentTimeLabel = '当前视频 08:24',
  onValueChange,
  onAction,
}: EntrySectionProps) {
  const descriptionId = entry.error ? 'entry-error' : 'entry-helper'

  return (
    <section className="workbench-section entry-section" aria-labelledby="entry-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">PLAN INPUT</span>
          <h2 id="entry-title">录入训练计划</h2>
        </div>
        <span className="section-heading__count">实时解析</span>
      </div>
      <label className="field-label" htmlFor="plan-text">动作、时间段、组数与休息</label>
      <textarea
        id="plan-text"
        className={`plan-textarea${entry.error ? ' plan-textarea--error' : ''}`}
        value={entry.value}
        placeholder={entry.placeholder}
        readOnly={readOnly}
        onInput={event => onValueChange?.((event.currentTarget as HTMLTextAreaElement).value)}
        aria-describedby={descriptionId}
      />
      {entry.error ? (
        <div className="entry-error" id="entry-error" role="alert">
          <strong>{entry.error.title}</strong>
          <p>{entry.error.message}</p>
          <span>{entry.error.hint}</span>
        </div>
      ) : (
        <p className="field-helper" id="entry-helper">{entry.helper}</p>
      )}
      <div className="insert-row" aria-label="插入视频时间">
        <span>{currentTimeLabel}</span>
        <button type="button" className="control-button" onClick={() => onAction?.({ id: 'insert-start', label: '插入开始' })}>插入开始</button>
        <button type="button" className="control-button" onClick={() => onAction?.({ id: 'insert-end', label: '插入结束' })}>插入结束</button>
      </div>
    </section>
  )
}

export interface GroupListProps {
  groups: GroupData[]
  page: number
  pageCount: number
  pageSize: number
  onPageChange?: (page: number) => void
  onAction?: (action: ActionData) => void
}

export function GroupList({ groups, page, pageCount, pageSize, onPageChange, onAction }: GroupListProps) {
  const start = (page - 1) * pageSize
  const visibleGroups = groups.slice(start, start + pageSize)

  return (
    <section className="workbench-section" aria-labelledby="groups-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">GROUP LIBRARY</span>
          <h2 id="groups-title">训练分组</h2>
        </div>
        <span className="section-heading__count">{groups.length} 个版本</span>
      </div>
      <div className="section-actions">
        <button type="button" className="control-button control-button--secondary" onClick={() => onAction?.({ id: 'new-group', label: '新建分组' })}>+ 新建</button>
        <button type="button" className="control-button control-button--quiet" onClick={() => onAction?.({ id: 'copy-group', label: '复制当前分组' })}>复制当前</button>
      </div>
      <div className="group-list">
        {visibleGroups.length > 0 ? visibleGroups.map((group) => (
          <div className="group-item-row" key={group.id}>
            <button
              className={`group-item${group.active ? ' group-item--active' : ''}`}
              type="button"
              onClick={() => onAction?.({ id: `switch-${group.id}`, label: `切换到${group.name}` })}
            >
              <span className="group-item__marker" aria-hidden="true" />
              <span className="group-item__body">
                <strong>{group.name}</strong>
                <small>{group.meta}</small>
              </span>
              <span className="group-item__progress">
                <span>{group.progress}</span>
                {group.locked && <small>已锁定</small>}
              </span>
              <span className="group-item__more" aria-hidden="true">···</span>
            </button>
            <div className="group-item-actions" aria-label={`${group.name} 操作`}>
              <button
                type="button"
                className="group-item-action"
                aria-label={`改名 ${group.name}`}
                title="改名"
                onClick={() => onAction?.({ id: `rename-${group.id}`, label: `改名${group.name}` })}
              >
                改名
              </button>
              <button
                type="button"
                className="group-item-action group-item-action--danger"
                aria-label={`删除 ${group.name}`}
                title="删除"
                onClick={() => onAction?.({ id: `delete-${group.id}`, label: `删除${group.name}`, tone: 'danger' })}
              >
                删除
              </button>
            </div>
          </div>
        )) : <div className="empty-state"><strong>还没有分组</strong><span>新建一套动作计划开始。</span></div>}
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
    </section>
  )
}

export function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange?: (page: number) => void }) {
  return (
    <div className="pagination" aria-label="分组分页">
      <button type="button" className="pagination__button" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>上一页</button>
      <span>第 {page} / {pageCount} 页</span>
      <button type="button" className="pagination__button" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)}>下一页</button>
    </div>
  )
}

export interface PlanInfoSectionProps {
  info: PlanInfoData
  readOnly?: boolean
  onChange?: (info: Partial<PlanInfoData>) => void
}

export function PlanInfoSection({ info, readOnly = true, onChange }: PlanInfoSectionProps) {
  return (
    <section className="workbench-section" aria-labelledby="plan-info-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">PLAN DETAILS</span>
          <h2 id="plan-info-title">计划信息</h2>
        </div>
      </div>
      <div className="form-grid">
        <label><span>标题</span><input value={info.title} readOnly={readOnly} onInput={event => onChange?.({ title: (event.currentTarget as HTMLInputElement).value })} /></label>
        <label><span>作者</span><input value={info.author} readOnly={readOnly} onInput={event => onChange?.({ author: (event.currentTarget as HTMLInputElement).value })} /></label>
        <label className="form-grid__wide"><span>备注</span><textarea value={info.notes} readOnly={readOnly} rows={3} onInput={event => onChange?.({ notes: (event.currentTarget as HTMLTextAreaElement).value })} /></label>
      </div>
    </section>
  )
}

export interface DataActionsSectionProps {
  data: DataActionsData
  onAction?: (action: ActionData) => void
}

export function DataActionsSection({ data, onAction }: DataActionsSectionProps) {
  return (
    <section className="workbench-section" aria-labelledby="data-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">DATA</span>
          <h2 id="data-title">数据</h2>
        </div>
      </div>
      <div className="data-actions">
        <button type="button" className="control-button" onClick={() => onAction?.({ id: 'import', label: '导入计划' })}>导入</button>
        <button type="button" className="control-button" onClick={() => onAction?.({ id: 'export', label: '导出计划' })}>导出</button>
        <button type="button" className="control-button control-button--secondary" onClick={() => onAction?.({ id: 'online-import', label: data.onlineLabel })}>{data.onlineLabel}</button>
      </div>
      <p className="field-helper">{data.helper}</p>
    </section>
  )
}

export interface SettingsPanelProps {
  settings: SettingsData
  onBeepDurationChange?: (duration: SettingsData['beepDuration']) => void
  onAction?: (action: ActionData) => void
}

export function SettingsPanel({ settings, onBeepDurationChange, onAction }: SettingsPanelProps) {
  return (
    <section className="workbench-section" aria-labelledby="settings-title">
      <div className="section-heading">
        <div>
          <span className="panel-kicker">SESSION SETTINGS</span>
          <h2 id="settings-title">设置</h2>
        </div>
      </div>
      <div className="settings-list">
        <label className="setting-row">
          <span><strong>休息提示音时长</strong><small>倒计时结束时播放</small></span>
          <select
            value={settings.beepDuration}
            onChange={event => {
              const duration = Number((event.currentTarget as HTMLSelectElement).value)
              if (duration === 1 || duration === 2 || duration === 3 || duration === 5) {
                onBeepDurationChange?.(duration)
              }
              onAction?.({ id: 'beep-duration', label: '调整提示音时长' })
            }}
          >
            {[1, 2, 3, 5].map((seconds) => <option value={seconds} key={seconds}>{seconds}s</option>)}
          </select>
        </label>
        <label className="setting-row setting-row--toggle">
          <span><strong>锁定预览</strong><small>{settings.note}</small></span>
          <input type="checkbox" checked={settings.locked} onChange={() => onAction?.({ id: 'toggle-preview-lock', label: '切换预览锁定' })} />
        </label>
      </div>
    </section>
  )
}

export interface TrainingDeckProps {
  data: WorkoutMockData
  trainingProgress?: import('preact').ComponentChildren
  onAction?: (action: ActionData) => void
}

export interface TrainingProgressProps {
  completedExercises: number
  totalExercises: number
  currentExercise: number
}

export function TrainingProgress({
  completedExercises,
  totalExercises,
  currentExercise,
}: TrainingProgressProps) {
  const progress = totalExercises > 0
    ? Math.min(100, Math.max(0, (completedExercises / totalExercises) * 100))
    : 0

  return (
    <section className="training-progress" data-testid="training-progress" aria-label="整份训练进度">
      <div className="training-progress__copy">
        <span>全局进度</span>
        <strong>已完成 {completedExercises} / {totalExercises} 个动作</strong>
        <small>{totalExercises > 0 ? `当前第 ${currentExercise} 项` : '暂无动作'}</small>
      </div>
      <div
        className="training-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalExercises}
        aria-valuenow={completedExercises}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </section>
  )
}

export interface RuntimeRecoveryPromptProps {
  exerciseName: string
  currentExercise: number
  totalExercises: number
  currentSet: number
  totalSets: number
  onConfirm: () => void
  onDismiss: () => void
}

export function RuntimeRecoveryPrompt({
  exerciseName,
  currentExercise,
  totalExercises,
  currentSet,
  totalSets,
  onConfirm,
  onDismiss,
}: RuntimeRecoveryPromptProps) {
  return (
    <div className="runtime-recovery" data-testid="runtime-recovery">
      <section className="runtime-recovery__dialog" role="dialog" aria-modal="true" aria-labelledby="runtime-recovery-title">
        <span className="panel-kicker">SESSION RECOVERY</span>
        <h2 id="runtime-recovery-title">继续上次训练</h2>
        <p>{exerciseName} · 第 {currentSet} / {totalSets} 组</p>
        <small>动作 {currentExercise} / {totalExercises}</small>
        <div className="runtime-recovery__actions">
          <button type="button" className="control-button control-button--quiet" onClick={onDismiss}>不继续</button>
          <button type="button" className="control-button control-button--secondary" onClick={onConfirm}>继续上次训练</button>
        </div>
      </section>
    </div>
  )
}

export function TrainingDeck({ data, trainingProgress, onAction }: TrainingDeckProps) {
  return (
    <section className={`training-deck training-deck--${data.status}`} data-testid="training-deck" data-status={data.status}>
      <div className="training-deck__scrim" aria-hidden="true" />
      {data.status === 'rest' && (
        <div className="training-deck__rest-overlay" aria-hidden="true">
          <strong>{data.restRemaining}</strong>
          <span>休息</span>
        </div>
      )}
      <div className="training-deck__panel">
        <div className="training-deck__eyebrow"><span>TRAINING DECK</span><span>视频保留 · 其余已遮罩</span></div>
        {trainingProgress}
        <StatusHeader
          status={data.status}
          title={data.title}
          statusLabel={data.statusLabel}
          statusNote={data.statusNote}
          phase={data.phase}
          groupName={data.groupName}
          currentSet={data.currentSet}
          totalSets={data.totalSets}
        />
        <Metrics metrics={data.metrics} />
        <PrimaryAction action={data.primaryAction} onAction={onAction} />
        <SecondaryControlRow actions={data.secondaryActions} onAction={onAction} />
        <PreviewList items={data.previewItems} locked={data.lockedPreview} onAction={onAction} />
        <SafetyActionZone safety={data.safety} onAction={onAction} />
      </div>
    </section>
  )
}

export interface PlanWorkbenchProps {
  data: WorkoutMockData
  readOnlyEntry?: boolean
  currentTimeLabel?: string
  onPlanInputChange?: (value: string) => void
  onPlanInfoChange?: (info: Partial<PlanInfoData>) => void
  onBeepDurationChange?: (duration: SettingsData['beepDuration']) => void
  onAction?: (action: ActionData) => void
}

export function PlanWorkbench({
  data,
  readOnlyEntry = true,
  currentTimeLabel,
  onPlanInputChange,
  onPlanInfoChange,
  onBeepDurationChange,
  onAction,
}: PlanWorkbenchProps) {
  return (
    <section className="plan-workbench" data-testid="plan-workbench">
      <div className="plan-workbench__veil" aria-hidden="true" />
      <aside className="plan-workbench__drawer">
        <header className="drawer-header">
          <div><span className="panel-kicker">PLAN WORKBENCH</span><h1>准备训练</h1><p>{data.groupName}</p></div>
          <button type="button" className="icon-button" aria-label="收起工作台" onClick={() => onAction?.({ id: 'close-workbench', label: '收起工作台' })}>×</button>
        </header>
        <div className="drawer-scroll">
          <div className="drawer-start">
            <PrimaryAction action={{ id: 'start-training', label: '开始训练', note: '关闭工作台并进入训练舱', tone: 'primary' }} onAction={onAction} />
          </div>
          <EntrySection
            entry={data.entry}
            readOnly={readOnlyEntry}
            currentTimeLabel={currentTimeLabel}
            onValueChange={onPlanInputChange}
            onAction={onAction}
          />
          <GroupList groups={data.groups} page={data.groupPage} pageCount={data.groupPageCount} pageSize={data.groupPageSize} onPageChange={(page) => onAction?.({ id: `group-page-${page}`, label: `查看第 ${page} 页` })} onAction={onAction} />
          <PlanInfoSection info={data.planInfo} readOnly={readOnlyEntry} onChange={onPlanInfoChange} />
          <DataActionsSection data={data.dataActions} onAction={onAction} />
          <SettingsPanel
            settings={data.settings}
            onBeepDurationChange={onBeepDurationChange}
            onAction={onAction}
          />
        </div>
      </aside>
    </section>
  )
}

export interface DockBarProps {
  view: ViewMode
  groupName: string
  onViewChange?: (view: ViewMode) => void
  onAction?: (action: ActionData) => void
}

export function DockBar({ view, groupName, onViewChange, onAction }: DockBarProps) {
  return (
    <nav className="dock-bar" data-testid="dock-bar" aria-label="常驻控制条">
      <div className="dock-bar__brand"><strong>BF</strong><span>· {groupName}</span></div>
      <div className="dock-bar__actions">
        <button type="button" className={view === 'workbench' ? 'dock-button dock-button--active' : 'dock-button'} onClick={() => onViewChange?.(view === 'workbench' ? 'dock' : 'workbench')}>工作台</button>
        <button type="button" className={view === 'training' ? 'dock-button dock-button--active' : 'dock-button'} onClick={() => onViewChange?.(view === 'training' ? 'dock' : 'training')}>{view === 'training' ? '训练中' : '训练舱'}</button>
        {view === 'dock' && <button type="button" className="dock-button dock-button--accent" onClick={() => onAction?.({ id: 'open-workbench', label: '打开工作台' })}>打开</button>}
      </div>
    </nav>
  )
}
