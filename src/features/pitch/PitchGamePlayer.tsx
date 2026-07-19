import { useState } from 'react'
import { btnPrimary, btnSecondary, card } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { submitPitchResult, usePitchResults } from './pitchGameApi'
import { centsOffFolded, freqToNoteName, midiToFreq, playTone, recordPitch } from './pitchAudio'
import type { Player } from '../../types/game'

type Props = {
  roomCode: string
  uid: string
  players: Player[]
  targetMidi: number
}

type AttemptState = 'idle' | 'recording' | 'no_pitch' | 'mic_denied'

export function PitchGamePlayer({ roomCode, uid, players, targetMidi }: Props) {
  const results = usePitchResults(roomCode)
  const [attempt, setAttempt] = useState<AttemptState>('idle')
  const [playingTone, setPlayingTone] = useState(false)

  const myResult = results[uid] ?? null
  const standings = players
    .filter((p) => results[p.uid])
    .sort((a, b) => Math.abs(results[a.uid].centsOff) - Math.abs(results[b.uid].centsOff))

  async function handlePlayTone() {
    setPlayingTone(true)
    try {
      await playTone(midiToFreq(targetMidi))
    } finally {
      setPlayingTone(false)
    }
  }

  async function handleRecord() {
    setAttempt('recording')
    let freq: number | null
    try {
      freq = await recordPitch()
    } catch {
      setAttempt('mic_denied')
      return
    }
    if (freq === null) {
      setAttempt('no_pitch')
      return
    }
    const cents = centsOffFolded(freq, midiToFreq(targetMidi))
    await submitPitchResult(roomCode, uid, freq, cents)
    setAttempt('idle')
  }

  return (
    <div className={`animate-fade-in-up mx-auto max-w-md p-6 text-center ${card}`}>
      <h2 className="mb-1 font-display text-2xl font-medium text-crt-amber-light">Pitch-Off!</h2>
      <p className="mb-5 text-sm text-crt-cream/60">
        Listen to the note, then hum it back. Closest player takes the board.
      </p>

      {!myResult ? (
        <div className="flex flex-col items-center gap-3">
          <button onClick={handlePlayTone} disabled={playingTone} className={btnSecondary}>
            {playingTone ? '🔊 Playing…' : '🔊 Play the pitch'}
          </button>

          {attempt === 'recording' ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-xl">
              <span className="animate-pulse text-3xl">🎤</span>
            </div>
          ) : (
            <button onClick={handleRecord} className={`${btnPrimary} px-6 py-3`}>
              🎤 Record my attempt
            </button>
          )}

          {attempt === 'recording' && <p className="text-sm text-crt-cream/60">Hum now — hold the note!</p>}
          {attempt === 'no_pitch' && (
            <p className="text-sm text-amber-300">
              Couldn&apos;t hear a clear note — get closer to the mic and try again.
            </p>
          )}
          {attempt === 'mic_denied' && (
            <p className="text-sm text-red-300">
              Microphone access is blocked — allow it in your browser and try again.
            </p>
          )}
          {attempt === 'idle' && (
            <p className="text-xs text-crt-cream/40">One good take is all you get — warm up first!</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-crt-cream">
            You hummed <span className="text-crt-amber-light">{freqToNoteName(myResult.detectedHz)}</span> —{' '}
            <span className="font-semibold">{Math.abs(myResult.centsOff)}¢ off</span>
          </p>
          <p className="flex items-center gap-2 text-sm text-crt-cream/50">
            <Spinner className="h-3 w-3" /> Waiting for the host to call it…
          </p>
        </div>
      )}

      {standings.length > 0 && (
        <ul className="mt-6 space-y-1.5 text-left">
          {standings.map((p, i) => (
            <li
              key={p.uid}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                i === 0 ? 'bg-crt-amber/15 text-crt-amber-light' : 'bg-crt-cream/5 text-crt-cream/70'
              }`}
            >
              <span>
                {i === 0 && '🎯 '}
                {p.displayName}
                {p.uid === uid && ' (you)'}
              </span>
              <span>{Math.abs(results[p.uid].centsOff)}¢</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
