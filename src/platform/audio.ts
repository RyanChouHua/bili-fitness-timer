type AudioContextConstructor = typeof AudioContext

type WebkitAudioWindow = Window & {
  webkitAudioContext?: AudioContextConstructor
}

export async function beep(durationSeconds: number): Promise<void> {
  const AudioContextConstructor =
    window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext
  if (!AudioContextConstructor) {
    return
  }

  const context = new AudioContextConstructor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationSeconds)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + durationSeconds)

  await new Promise<void>(resolve => {
    window.setTimeout(resolve, durationSeconds * 1000 + 80)
  })
  await context.close()
}
