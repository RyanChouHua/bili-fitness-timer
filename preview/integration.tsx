import { render } from 'preact'
import { ConnectedApp } from '../src/ui'
import { createWorkoutStore } from '../src/state/store'
import type { VideoLike } from '../src/state/store'
import '../src/ui/styles.css'
import './integration.css'

const bvid = 'BV1xx411c7mD'
const planKey = `bili-fitness-timer:${bvid}`
const planText = [
  '深蹲 00:01-00:02 2x1 rest1',
  '俯卧撑 00:03-00:04 1x1 rest1',
].join('\n')

localStorage.setItem(
  planKey,
  JSON.stringify({
    schemaVersion: 2,
    bvid,
    activeGroupId: 'integration-group',
    groups: [
      {
        id: 'integration-group',
        rawInput: planText,
        settings: { beepDuration: 1, pauseDuringRest: true },
        savedExercises: [],
        bvid,
        title: 'Mock video 集成流程',
      },
    ],
  }),
)

const video = document.querySelector<HTMLVideoElement>('video')
const root = document.querySelector<HTMLElement>('#integration-root')
const status = document.querySelector<HTMLOutputElement>('#integration-status')
if (!video || !root || !status) {
  throw new Error('Integration preview mount points are missing')
}

let paused = true
Object.defineProperty(video, 'paused', { configurable: true, get: () => paused })
video.play = () => {
  paused = false
  return Promise.resolve()
}
video.pause = () => {
  paused = true
}

let beepCount = 0
const store = createWorkoutStore({
  bvid,
  storage: localStorage,
  beep: duration => {
    beepCount += 1
    status.dataset.beepCount = String(beepCount)
    status.dataset.beepDuration = String(duration)
  },
})
store.attachVideo(video as VideoLike)

const reflectState = (): void => {
  const state = store.getState()
  status.dataset.runtimeMode = state.runtime.mode
  status.dataset.exerciseIndex = String(state.runtime.exerciseIndex)
  status.dataset.setIndex = String(state.runtime.setIndex)
  status.dataset.restRemaining = String(state.runtime.restRemaining)
  status.dataset.videoCurrentTime = String(video.currentTime)
  status.dataset.videoPaused = String(video.paused)
}
store.subscribe(reflectState)
reflectState()
render(<ConnectedApp store={store} />, root)

