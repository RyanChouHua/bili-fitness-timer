import { h, render } from 'preact'
import uiStyles from './ui/styles.css?inline'
import { ConnectedApp } from './ui'
import { createWorkoutStore, type WorkoutStore } from './state/store'
import {
  createPageTakeover,
  extractBvidFromUrl,
  waitForVideo,
  watchBvidChanges,
  type PageTakeoverController,
} from './platform/bilibili'

const rootId = 'bili-fitness-timer-v2-root'
const styleId = 'bili-fitness-timer-v2-style'
const teardownKey = '__biliFitnessTimerV2Teardown__'

type RuntimeWindow = Window & {
  [teardownKey]?: () => void
}

interface ActiveMount {
  store: WorkoutStore
  takeover: PageTakeoverController
  unsubscribe: () => void
  root: HTMLElement
}

let activeMount: ActiveMount | null = null
let navigationGeneration = 0
let stopNavigationWatcher: (() => void) | null = null

function injectStyles(): void {
  if (document.getElementById(styleId)) {
    return
  }

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = uiStyles
  document.head.append(style)
}

function createRoot(bvid: string): HTMLElement {
  document.getElementById(rootId)?.remove()
  const root = document.createElement('div')
  root.id = rootId
  root.dataset.bvid = bvid
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100dvh',
    zIndex: '2147483647',
    pointerEvents: 'none',
    isolation: 'isolate',
  })
  document.body.append(root)
  return root
}

function teardownMount(): void {
  const mount = activeMount
  activeMount = null
  if (!mount) {
    document.getElementById(rootId)?.remove()
    return
  }

  mount.unsubscribe()
  mount.takeover.destroy()
  mount.store.dispose()
  render(null, mount.root)
  mount.root.remove()
}

async function mountForBvid(bvid: string | null): Promise<void> {
  const generation = ++navigationGeneration
  teardownMount()
  if (!bvid) {
    return
  }

  const video = await waitForVideo()
  if (
    generation !== navigationGeneration ||
    !video ||
    extractBvidFromUrl(window.location.href) !== bvid
  ) {
    return
  }

  injectStyles()
  const root = createRoot(bvid)
  const store = createWorkoutStore({ bvid, storageId: bvid })
  store.attachVideo(video)
  render(h(ConnectedApp, { store }), root)

  const takeover = createPageTakeover(video, root)
  const syncTakeover = (): void => {
    takeover.setActive(store.getState().view === 'training')
  }
  const unsubscribe = store.subscribe(syncTakeover)
  syncTakeover()

  if (generation !== navigationGeneration) {
    unsubscribe()
    takeover.destroy()
    store.dispose()
    render(null, root)
    root.remove()
    return
  }

  activeMount = { store, takeover, unsubscribe, root }
}

function stopRuntime(): void {
  navigationGeneration += 1
  stopNavigationWatcher?.()
  stopNavigationWatcher = null
  teardownMount()
}

const runtimeWindow = window as RuntimeWindow
runtimeWindow[teardownKey]?.()
runtimeWindow[teardownKey] = stopRuntime

void mountForBvid(extractBvidFromUrl(window.location.href))
stopNavigationWatcher = watchBvidChanges(({ bvid }) => {
  void mountForBvid(bvid)
})

