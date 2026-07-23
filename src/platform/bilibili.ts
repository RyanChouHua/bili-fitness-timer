const bvidPattern = /BV[0-9A-Za-z]{10}/i
const navigationPollIntervalMs = 1000
const videoWaitTimeoutMs = 10_000
const takeoverZIndex = '2147483645'
const takeoverBackground = 'rgba(9, 16, 21, 0.9)'

const videoContainerSelectors = [
  '#bilibili-player',
  '.bpx-player-container',
  '.bilibili-player',
  '.video-container-v1',
  '.player-wrap',
]

const commentContainerSelectors = [
  '#commentapp',
  '#comment',
  '.comment-container',
  '.reply-warp',
  '[data-module="comment"]',
]

export interface BvidChange {
  bvid: string | null
  previousBvid: string | null
}

export type BvidChangeCallback = (change: BvidChange) => void

export interface VideoLoopSegment {
  start: number
  end: number
}

export interface BilibiliPageRegions {
  video: HTMLElement
  comments: HTMLElement
}

export interface PageTakeoverController {
  setActive(active: boolean): void
  refresh(): void
  destroy(): void
}

export type VideoLoopSegmentProvider = () => VideoLoopSegment | null

const guardedVideos = new WeakSet<HTMLVideoElement>()
const loopSegmentProviders = new WeakMap<HTMLVideoElement, VideoLoopSegmentProvider>()

function normalizeBvid(value: string): string | null {
  const match = value.match(bvidPattern)
  if (!match) {
    return null
  }
  return `BV${match[0].slice(2)}`
}

function isBilibiliUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'bilibili.com' || parsed.hostname.endsWith('.bilibili.com')
  } catch {
    return false
  }
}

export function extractBvidFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!isBilibiliUrl(url)) {
      return null
    }

    for (const [key, value] of parsed.searchParams) {
      const normalizedKey = key.toLowerCase()
      if (normalizedKey === 'bvid' || normalizedKey === 'bv_id') {
        const queryBvid = normalizeBvid(value)
        if (queryBvid) {
          return queryBvid
        }
      }
    }

    return normalizeBvid(`${parsed.pathname}${parsed.search}${parsed.hash}`)
  } catch {
    return normalizeBvid(url)
  }
}

export function waitForVideo(timeoutMs = videoWaitTimeoutMs): Promise<HTMLVideoElement | null> {
  const existing = document.querySelector<HTMLVideoElement>('video')
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise(resolve => {
    let timeoutId: number | undefined
    const observer = new MutationObserver(() => {
      const video = document.querySelector<HTMLVideoElement>('video')
      if (video) {
        finish(video)
      }
    })
    const finish = (video: HTMLVideoElement | null): void => {
      observer.disconnect()
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      resolve(video)
    }

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
    timeoutId = window.setTimeout(() => finish(null), timeoutMs)
  })
}

export function watchBvidChanges(callback: BvidChangeCallback): () => void {
  let previousBvid = extractBvidFromUrl(window.location.href)
  const intervalId = window.setInterval(() => {
    const bvid = extractBvidFromUrl(window.location.href)
    if (bvid === previousBvid) {
      return
    }

    const change = { bvid, previousBvid }
    previousBvid = bvid
    callback(change)
  }, navigationPollIntervalMs)

  return () => window.clearInterval(intervalId)
}

export function bindVideoLoopGuard(
  video: HTMLVideoElement,
  getActiveSegment: VideoLoopSegmentProvider,
): void {
  loopSegmentProviders.set(video, getActiveSegment)
  if (guardedVideos.has(video)) {
    return
  }

  guardedVideos.add(video)
  video.addEventListener('timeupdate', () => {
    const segment = loopSegmentProviders.get(video)?.()
    if (!segment) {
      return
    }

    if (video.currentTime >= segment.end || video.currentTime < segment.start - 0.25) {
      video.currentTime = segment.start
      if (video.paused) {
        void video.play().catch(() => undefined)
      }
    }
  })
}

function findContainingElement(selectors: string[], target: Element): HTMLElement | null {
  for (const selector of selectors) {
    const closest = target.closest<HTMLElement>(selector)
    if (closest) {
      return closest
    }

    const containing = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(element =>
      element.contains(target),
    )
    if (containing) {
      return containing
    }
  }

  return null
}

export function findBilibiliPageRegions(
  targetVideo: HTMLVideoElement | null = document.querySelector<HTMLVideoElement>('video'),
): BilibiliPageRegions | null {
  if (!targetVideo) {
    return null
  }

  const video = findContainingElement(videoContainerSelectors, targetVideo) ?? targetVideo
  const comments = commentContainerSelectors
    .map(selector => document.querySelector<HTMLElement>(selector))
    .find((element): element is HTMLElement => element !== null)

  return comments ? { video, comments } : null
}

interface VisibleRect {
  top: number
  right: number
  bottom: number
  left: number
}

function visibleRect(element: HTMLElement): VisibleRect | null {
  const rect = element.getBoundingClientRect()
  const top = Math.max(0, Math.min(window.innerHeight, rect.top))
  const right = Math.max(0, Math.min(window.innerWidth, rect.right))
  const bottom = Math.max(0, Math.min(window.innerHeight, rect.bottom))
  const left = Math.max(0, Math.min(window.innerWidth, rect.left))
  if (right - left < 2 || bottom - top < 2) {
    return null
  }

  return { top, right, bottom, left }
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  const sorted = intervals
    .filter(([start, end]) => end > start)
    .sort((left, right) => left[0] - right[0])
  const merged: Array<[number, number]> = []

  for (const interval of sorted) {
    const previous = merged[merged.length - 1]
    if (!previous || interval[0] > previous[1]) {
      merged.push([...interval])
    } else {
      previous[1] = Math.max(previous[1], interval[1])
    }
  }

  return merged
}

function createBlocker(
  container: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  if (width < 1 || height < 1) {
    return
  }

  const blocker = document.createElement('div')
  blocker.style.position = 'absolute'
  blocker.style.left = `${left}px`
  blocker.style.top = `${top}px`
  blocker.style.width = `${width}px`
  blocker.style.height = `${height}px`
  blocker.style.background = takeoverBackground
  blocker.style.pointerEvents = 'auto'
  container.append(blocker)
}

function renderBlockers(container: HTMLElement, holes: VisibleRect[]): void {
  container.replaceChildren()
  const width = window.innerWidth
  const height = window.innerHeight
  const yEdges = Array.from(
    new Set([0, height, ...holes.flatMap(rect => [rect.top, rect.bottom])]),
  ).sort((left, right) => left - right)

  for (let index = 0; index < yEdges.length - 1; index += 1) {
    const top = yEdges[index]
    const bottom = yEdges[index + 1]
    const intervals = mergeIntervals(
      holes
        .filter(rect => rect.top < bottom && rect.bottom > top)
        .map(rect => [rect.left, rect.right]),
    )
    let cursor = 0
    for (const [left, right] of intervals) {
      createBlocker(container, cursor, top, left - cursor, bottom - top)
      cursor = Math.max(cursor, right)
    }
    createBlocker(container, cursor, top, width - cursor, bottom - top)
  }
}

export function createPageTakeover(
  targetVideo: HTMLVideoElement,
  uiRoot?: HTMLElement,
): PageTakeoverController {
  const container = document.createElement('div')
  container.id = 'bili-fitness-timer-takeover'
  container.setAttribute('aria-hidden', 'true')
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    zIndex: takeoverZIndex,
    pointerEvents: 'none',
    display: 'none',
  })
  document.body.append(container)

  let active = false
  let destroyed = false
  let frameId: number | null = null

  const refreshNow = (): void => {
    frameId = null
    if (!active || destroyed) {
      return
    }

    const regions = findBilibiliPageRegions(targetVideo)
    if (!regions) {
      container.style.display = 'none'
      container.replaceChildren()
      return
    }

    const videoRect = visibleRect(regions.video)
    const commentsRect = visibleRect(regions.comments)
    const holes = [videoRect, commentsRect].filter((rect): rect is VisibleRect => rect !== null)
    container.style.display = 'block'
    renderBlockers(container, holes)

    if (uiRoot && videoRect) {
      uiRoot.style.setProperty('--bft-video-left', `${videoRect.left}px`)
      uiRoot.style.setProperty('--bft-video-top', `${videoRect.top}px`)
      uiRoot.style.setProperty('--bft-video-width', `${videoRect.right - videoRect.left}px`)
      uiRoot.style.setProperty('--bft-video-height', `${videoRect.bottom - videoRect.top}px`)
    }
  }

  const refresh = (): void => {
    if (frameId !== null || destroyed) {
      return
    }
    frameId = window.requestAnimationFrame(refreshNow)
  }

  const observer = new MutationObserver(records => {
    if (records.some(record => !container.contains(record.target))) {
      refresh()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', refresh)
  window.addEventListener('scroll', refresh, true)

  return {
    setActive(nextActive) {
      active = nextActive
      if (!active) {
        container.style.display = 'none'
        container.replaceChildren()
        return
      }
      refresh()
    },
    refresh,
    destroy() {
      if (destroyed) {
        return
      }
      destroyed = true
      observer.disconnect()
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      uiRoot?.style.removeProperty('--bft-video-left')
      uiRoot?.style.removeProperty('--bft-video-top')
      uiRoot?.style.removeProperty('--bft-video-width')
      uiRoot?.style.removeProperty('--bft-video-height')
      container.remove()
    },
  }
}
