import { render } from 'preact'
import type { ComponentChildren } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import { App } from '../src/ui'
import type { ViewMode, WorkoutStatus } from '../src/ui'
import '../src/ui/styles.css'
import {
  createMockData,
  SAMPLE_OPTIONS,
  STATUS_OPTIONS,
  WIDTH_OPTIONS,
  type SampleId,
} from './mock-data'
import './styles.css'

function MockBilibiliPage({ view, widthId }: { view: ViewMode; widthId: string }) {
  return (
    <div className={`mock-bili-page mock-bili-page--${view} mock-bili-page--${widthId}`} aria-label="模拟 B 站视频页">
      <header className="mock-bili-header">
        <div className="mock-bili-header__logo">哔哩哔哩</div>
        <div className="mock-bili-header__search">搜索视频、番剧、用户 <span>⌕</span></div>
        <div className="mock-bili-header__user"><span className="mock-avatar" /> 登录　大会员　投稿</div>
      </header>
      <div className="mock-bili-page__body">
        <main className="mock-video-column">
          <div className="mock-video-frame" data-testid="mock-video">
            <div className="mock-video-frame__center"><span>▶</span><strong>动作片段 · 深蹲</strong><small>00:12 / 00:40</small></div>
            <div className="mock-video-frame__controls" aria-label="模拟原生播放器控件">
              <span>▶</span><span className="mock-progress"><i /></span><span>◉</span><span>⚙</span><span>⛶</span>
            </div>
          </div>
          <div className="mock-video-actions" aria-label="模拟视频操作">
            <span>♡ 点赞 2.4万</span><span>☆ 投币 1.2万</span><span>▣ 收藏 8.6万</span><span>↗ 分享</span>
          </div>
          <section className="mock-comments" data-testid="mock-comments">
            <div className="mock-comments__heading"><strong>评论</strong><span>1.2万 条评论</span></div>
            <div className="mock-comment"><span className="mock-avatar" /><div><strong>训练打卡第 14 天</strong><p>这个动作片段很适合跟练，感谢整理！</p></div></div>
            <div className="mock-comment"><span className="mock-avatar mock-avatar--alt" /><div><strong>阿健</strong><p>组间休息的提示很清楚。</p></div></div>
          </section>
        </main>
        <aside className="mock-recommendations" aria-label="模拟推荐列表">
          <div className="mock-recommendations__title">接下来播放</div>
          {[1, 2, 3, 4, 5].map((item) => <div className="mock-recommendation" key={item}><span className="mock-thumbnail">{item}</span><div><strong>居家训练跟练 · 第 {item} 集</strong><small>健身频道 · {item + 2}.1 万播放</small></div></div>)}
        </aside>
      </div>
    </div>
  )
}

function ControlGroup({ label, children }: { label: string; children: ComponentChildren }) {
  return <div className="preview-control" role="group" aria-label={label}><span className="preview-control__label">{label}</span><div className="preview-control__buttons">{children}</div></div>
}

function PreviewWorkbench() {
  const [view, setView] = useState<ViewMode>('training')
  const [status, setStatus] = useState<WorkoutStatus>('idle')
  const [sample, setSample] = useState<SampleId>('normal')
  const [widthId, setWidthId] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [groupPage, setGroupPage] = useState(1)
  const [lastAction, setLastAction] = useState('等待操作')
  const width = WIDTH_OPTIONS.find((item) => item.id === widthId) ?? WIDTH_OPTIONS[2]
  const data = useMemo(() => ({ ...createMockData(status, sample), groupPage }), [status, sample, groupPage])

  const handleAction = (actionId: string) => {
    setLastAction(`假操作 · ${actionId}`)
    if (actionId === 'start-training') {
      setView('training')
      setStatus('exercise')
    }
    if (actionId === 'open-workbench') setView('workbench')
    if (actionId === 'close-workbench') setView('dock')
    if (actionId === 'reset') setSample('reset-confirm')
    if (actionId === 'confirm-reset') {
      setSample('normal')
      setStatus('idle')
    }
  }

  return (
    <main className="preview-workbench">
      <header className="preview-toolbar">
        <div className="preview-toolbar__brand"><strong>BF / CARD 2R</strong><span>三区域界面预览 · 纯假数据</span></div>
        <ControlGroup label="形态">
          {(['training', 'workbench', 'dock'] as ViewMode[]).map((mode) => (
            <button type="button" className={view === mode ? 'is-active' : ''} aria-pressed={view === mode} data-view={mode} key={mode} onClick={() => setView(mode)}><span>{mode === 'training' ? '训练舱' : mode === 'workbench' ? '工作台' : '控制条'}</span><small>{mode === 'training' ? '覆盖层' : mode === 'workbench' ? '右侧抽屉' : '始终在'}</small></button>
          ))}
        </ControlGroup>
        <ControlGroup label="状态">
          {STATUS_OPTIONS.map((option) => <button type="button" className={status === option.id ? 'is-active' : ''} aria-pressed={status === option.id} data-status={option.id} key={option.id} onClick={() => setStatus(option.id)}><span>{option.label}</span><small>{option.hint}</small></button>)}
        </ControlGroup>
        <ControlGroup label="样本">
          {SAMPLE_OPTIONS.map((option) => <button type="button" className={sample === option.id ? 'is-active' : ''} aria-pressed={sample === option.id} data-sample={option.id} key={option.id} onClick={() => { setSample(option.id); setGroupPage(1) }}><span>{option.label}</span><small>{option.hint}</small></button>)}
        </ControlGroup>
        <ControlGroup label="宽度">
          {WIDTH_OPTIONS.map((option) => <button type="button" className={widthId === option.id ? 'is-active' : ''} aria-pressed={widthId === option.id} data-width={option.id} key={option.id} onClick={() => setWidthId(option.id)}><span>{option.label}</span><small>{option.width}px</small></button>)}
        </ControlGroup>
      </header>

      <section className="preview-stage-wrap" aria-label="三区域预览画布">
        <div className={`preview-stage preview-stage--${width.id}`} data-testid="preview-stage" data-view={view} data-status={status} style={{ width: `${width.width}px`, height: `${width.height}px` }}>
          <MockBilibiliPage view={view} widthId={width.id} />
          <App data={data} view={view} onViewChange={setView} onGroupPageChange={setGroupPage} onAction={handleAction} />
          <footer className="preview-stage__status"><span>{view === 'training' ? '训练舱覆盖层' : view === 'workbench' ? '工作台抽屉' : '常驻控制条'} · {status}</span><output>{lastAction}</output></footer>
        </div>
      </section>
    </main>
  )
}

const root = document.querySelector('#preview-root')
if (!root) throw new Error('Preview root not found')
render(<PreviewWorkbench />, root)
