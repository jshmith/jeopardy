/** Web Audio helpers for the pitch minigame: synthesize the reference tone and
 * detect the pitch of a hummed/sung note from the microphone. */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function noteName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function freqToNoteName(freq: number): string {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440))
  return noteName(midi)
}

/** Signed distance in cents from `freq` to `targetFreq`, folded to the nearest
 * octave ([-600, 600]) so singing in a different octave isn't penalized. */
export function centsOffFolded(freq: number, targetFreq: number): number {
  let cents = 1200 * Math.log2(freq / targetFreq)
  cents = ((cents % 1200) + 1200) % 1200
  if (cents > 600) cents -= 1200
  return Math.round(cents)
}

let sharedCtx: AudioContext | null = null
function audioCtx(): AudioContext {
  sharedCtx ??= new AudioContext()
  return sharedCtx
}

/** Play a soft sine tone at `freq` for `seconds`. Resolves when it finishes. */
export async function playTone(freq: number, seconds = 2): Promise<void> {
  const ac = audioCtx()
  await ac.resume()
  return new Promise((resolve) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ac.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05)
    gain.gain.setValueAtTime(0.3, t + seconds - 0.15)
    gain.gain.linearRampToValueAtTime(0, t + seconds)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(t)
    osc.stop(t + seconds)
    osc.onended = () => resolve()
  })
}

/** Classic time-domain autocorrelation pitch detector (à la Chris Wilson's
 * pitch-detect demo): returns the dominant frequency in Hz, or null if the
 * buffer is too quiet or aperiodic to call. */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return null // too quiet

  // Trim leading/trailing silence so the correlation focuses on the voiced part.
  const threshold = 0.2
  let r1 = 0
  let r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) > threshold) {
      r1 = i
      break
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) > threshold) {
      r2 = SIZE - i
      break
    }
  }
  const buf = buffer.slice(r1, r2)
  const size = buf.length
  if (size < 32) return null

  const c = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i]
    }
  }

  let d = 0
  while (d < size - 1 && c[d] > c[d + 1]) d++
  let maxval = -1
  let maxpos = -1
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  if (maxpos <= 0) return null

  // Parabolic interpolation around the peak for sub-sample precision.
  let T0 = maxpos
  const x1 = c[T0 - 1]
  const x2 = c[T0]
  const x3 = c[T0 + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  if (a) T0 = T0 - b / (2 * a)

  return sampleRate / T0
}

/** Records from the mic for `seconds` and returns the median detected pitch in
 * Hz, or null if no stable pitch was heard. Asks for mic permission on first use. */
export async function recordPitch(seconds = 2.5): Promise<number | null> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ac = audioCtx()
  await ac.resume()
  const source = ac.createMediaStreamSource(stream)
  const analyser = ac.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)

  const buf = new Float32Array(analyser.fftSize)
  const pitches: number[] = []
  const endAt = Date.now() + seconds * 1000

  try {
    while (Date.now() < endAt) {
      analyser.getFloatTimeDomainData(buf)
      const freq = autoCorrelate(buf, ac.sampleRate)
      // Human vocal fundamental range, generously.
      if (freq !== null && freq > 60 && freq < 1200) pitches.push(freq)
      await new Promise((r) => setTimeout(r, 50))
    }
  } finally {
    source.disconnect()
    stream.getTracks().forEach((t) => t.stop())
  }

  // Require a handful of consistent readings before calling it a pitch.
  if (pitches.length < 5) return null
  pitches.sort((a, b) => a - b)
  return pitches[Math.floor(pitches.length / 2)]
}
