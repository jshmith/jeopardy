import { useEffect, useState } from 'react'
import { Scoreboard } from '../../components/Scoreboard'
import { ClueDisplay } from '../../components/ClueDisplay'
import { useMyFinalAnswer, useMyFinalWager } from '../game/useGame'
import { btnPrimary, card, inputBase } from '../../lib/uiClasses'
import { submitFinalAnswer, submitFinalWager } from './playerActions'
import type { Game, Player, VideoSyncState } from '../../types/game'

type Props = {
  roomCode: string
  game: Game
  players: Player[]
  uid: string
  clockOffsetMs: number
}

export function FinalJeopardyPlayer({ roomCode, game, players, uid, clockOffsetMs }: Props) {
  const myWager = useMyFinalWager(roomCode, uid)
  const myAnswer = useMyFinalAnswer(roomCode, uid)
  const me = players.find((p) => p.uid === uid)

  if (game.phase === 'game_over') {
    const ranked = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-6 font-display text-3xl font-medium text-crt-amber-light">Final Standings</h1>
        <ol className="space-y-3">
          {ranked.map((p, i) => (
            <li
              key={p.uid}
              className={`animate-fade-in-up flex items-center justify-between p-4 ${card}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-semibold">
                {i + 1}. {p.displayName}
              </span>
              <span className="font-jeopardy text-xl text-crt-amber-light">${p.score}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Scoreboard players={players} highlightUid={uid} />
      <p className="mb-2 mt-6 text-center text-sm uppercase tracking-wide text-crt-cream/50">Final Jeopardy</p>
      <h1 className="mb-6 text-center font-display text-3xl font-medium text-crt-amber-light">
        {game.finalJeopardyMeta.category}
      </h1>

      {game.phase === 'final_category' && (
        <p className="animate-fade-in-up text-center text-crt-cream/70">Get ready to wager…</p>
      )}

      {game.phase === 'final_wagering' && me && (
        <WagerForm roomCode={roomCode} uid={uid} score={me.score} submitted={!!myWager} />
      )}

      {game.phase === 'final_answering' && game.currentClue && (
        <AnswerForm
          roomCode={roomCode}
          uid={uid}
          clue={game.currentClue}
          videoSync={game.videoSync ?? null}
          clockOffsetMs={clockOffsetMs}
          deadline={game.finalAnswerDeadline}
          submitted={!!myAnswer}
        />
      )}

      {game.phase === 'final_reveal' && (
        <p className="animate-fade-in-up text-center text-crt-cream/70">The host is revealing wagers and answers…</p>
      )}
    </div>
  )
}

function WagerForm({
  roomCode,
  uid,
  score,
  submitted,
}: {
  roomCode: string
  uid: string
  score: number
  submitted: boolean
}) {
  const maxWager = Math.max(score, 0)
  const [wager, setWager] = useState(0)
  const [sent, setSent] = useState(false)

  if (submitted || sent) return <p className="animate-fade-in-up text-center text-crt-cream/70">Wager locked in — waiting…</p>

  return (
    <div className={`animate-clue-in mx-auto flex max-w-sm flex-col items-center gap-4 p-8 text-center ${card}`}>
      <p className="text-crt-cream/80">
        Enter your wager (0–{maxWager})
      </p>
      <input
        type="number"
        min={0}
        max={maxWager}
        value={wager}
        onChange={(e) => setWager(Number(e.target.value))}
        className={`w-32 ${inputBase} text-center font-jeopardy text-xl`}
      />
      <button
        onClick={async () => {
          setSent(true)
          await submitFinalWager(roomCode, uid, wager)
        }}
        disabled={wager < 0 || wager > maxWager}
        className={btnPrimary}
      >
        Lock in wager
      </button>
    </div>
  )
}

function AnswerForm({
  roomCode,
  uid,
  clue,
  videoSync,
  clockOffsetMs,
  deadline,
  submitted,
}: {
  roomCode: string
  uid: string
  clue: Game['currentClue']
  videoSync: VideoSyncState | null
  clockOffsetMs: number
  deadline: number | null
  submitted: boolean
}) {
  const [answer, setAnswer] = useState('')
  const [sent, setSent] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  const secondsLeft = Math.max(0, Math.ceil(((deadline ?? now) - now) / 1000))
  const timeUp = secondsLeft <= 0

  if (!clue) return null

  if (submitted || sent) return <p className="animate-fade-in-up text-center text-crt-cream/70">Answer locked in — waiting…</p>

  return (
    <div className="flex flex-col items-center gap-4">
      <ClueDisplay clue={clue} video={{ role: 'viewer', sync: videoSync, clockOffsetMs }} />
      <p className={`font-jeopardy text-2xl ${timeUp ? 'text-red-400' : 'text-crt-amber-light'}`}>{secondsLeft}s</p>
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={timeUp}
        placeholder="Your answer"
        className={`w-full max-w-sm ${inputBase} text-center disabled:opacity-50`}
      />
      <button onClick={async () => {
          setSent(true)
          await submitFinalAnswer(roomCode, uid, answer)
        }}
        disabled={timeUp}
        className={btnPrimary}
      >
        Submit answer
      </button>
    </div>
  )
}
