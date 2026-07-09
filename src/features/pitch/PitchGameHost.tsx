import { btnPrimary, btnQuiet, btnSecondary, card } from '../../lib/uiClasses'
import { cancelPitchGame, finishPitchGame } from '../game/gameStateMachine'
import { usePitchResults } from './pitchGameApi'
import { midiToFreq, noteName, playTone } from './pitchAudio'
import type { Player } from '../../types/game'

type Props = {
  roomCode: string
  players: Player[]
  targetMidi: number
}

export function PitchGameHost({ roomCode, players, targetMidi }: Props) {
  const results = usePitchResults(roomCode)

  const standings = players
    .filter((p) => results[p.uid])
    .sort((a, b) => Math.abs(results[a.uid].centsOff) - Math.abs(results[b.uid].centsOff))
  const winner = standings[0]
  const waitingOn = players.filter((p) => !results[p.uid])

  return (
    <div className={`animate-fade-in-up mx-auto max-w-xl p-8 text-center ${card}`}>
      <h2 className="mb-1 font-jeopardy text-3xl text-jeopardy-gold">Pitch-Off!</h2>
      <p className="mb-6 text-sm text-white/60">
        Closest hum to the mystery note takes control of the board.
      </p>

      <div className="mb-6 flex flex-col items-center gap-2">
        <button onClick={() => void playTone(midiToFreq(targetMidi))} className={btnPrimary}>
          🔊 Play the pitch
        </button>
        <p className="text-xs text-white/40">
          Target: <span className="text-white/70">{noteName(targetMidi)}</span> — players hear it on
          their own devices too
        </p>
      </div>

      {standings.length > 0 && (
        <ul className="mb-6 space-y-2 text-left">
          {standings.map((p, i) => (
            <li
              key={p.uid}
              className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                i === 0 ? 'bg-jeopardy-gold/15 text-jeopardy-gold' : 'bg-white/5 text-white/80'
              }`}
            >
              <span className="font-semibold">
                {i === 0 && '🎯 '}
                {p.displayName}
              </span>
              <span className="text-sm">{Math.abs(results[p.uid].centsOff)}¢ off</span>
            </li>
          ))}
        </ul>
      )}

      {waitingOn.length > 0 && (
        <p className="mb-6 text-sm text-white/50">
          Waiting on: {waitingOn.map((p) => p.displayName).join(', ')}
        </p>
      )}

      <div className="flex justify-center gap-3">
        <button
          onClick={() => winner && finishPitchGame(roomCode, winner.uid)}
          disabled={!winner}
          className={btnSecondary}
        >
          {winner ? `Give ${winner.displayName} the board` : 'Waiting for attempts…'}
        </button>
        <button onClick={() => cancelPitchGame(roomCode)} className={btnQuiet}>
          Cancel
        </button>
      </div>
    </div>
  )
}
