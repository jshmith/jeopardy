import { useEffect, useState } from 'react'
import { Scoreboard } from '../../components/Scoreboard'
import { ClueDisplay } from '../../components/ClueDisplay'
import { useFinalAnswers, useFinalWagers } from '../game/useGame'
import { btnCorrect, btnIncorrect, btnPrimary, card } from '../../lib/uiClasses'
import { judgeFinalPlayer, moveToFinalAnswering, moveToFinalWagering, setFinalRevealOrder } from '../game/gameStateMachine'
import type { Game, Player, PrivateBoard } from '../../types/game'

const ANSWER_DURATION_MS = 60_000

type Props = {
  roomCode: string
  game: Game
  players: Player[]
  board: PrivateBoard
}

export function FinalJeopardyHost({ roomCode, game, players, board }: Props) {
  const wagers = useFinalWagers(roomCode)
  const answers = useFinalAnswers(roomCode)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (game.phase !== 'final_answering') return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [game.phase])

  if (game.phase === 'game_over') {
    const ranked = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="min-h-screen crt-page p-6 text-crt-cream">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-8 font-display text-4xl font-medium text-crt-amber-light">Final Standings</h1>
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
      </div>
    )
  }

  return (
    <div className="min-h-screen crt-page p-4 text-crt-cream md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl border border-crt-cream/10 bg-crt-cream/5 px-4 py-2 shadow-inner shadow-black/20">
            <span className="text-xs uppercase tracking-wide text-crt-cream/50">Room code</span>
            <div className="font-jeopardy text-3xl tracking-widest text-crt-amber-light">{roomCode}</div>
          </div>
          <Scoreboard players={players} />
        </div>

        <p className="mb-2 text-sm uppercase tracking-wide text-crt-cream/50">Final Jeopardy</p>
        <h1 className="mb-6 font-display text-3xl font-medium text-crt-amber-light">{game.finalJeopardyMeta.category}</h1>

        {game.phase === 'final_category' && (
          <button onClick={() => moveToFinalWagering(roomCode)} className={btnPrimary}>
            Start Wagering
          </button>
        )}

        {game.phase === 'final_wagering' && (
          <div className="space-y-4">
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.uid} className={`flex justify-between p-3 ${card}`}>
                  <span>{p.displayName}</span>
                  <span className={wagers[p.uid] ? 'text-crt-amber-light' : 'text-crt-cream/50'}>
                    {wagers[p.uid] ? 'Wager locked in' : 'Waiting…'}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={() => moveToFinalAnswering(roomCode, board, ANSWER_DURATION_MS)} className={btnPrimary}>
              Reveal Clue &amp; Start Timer
            </button>
          </div>
        )}

        {game.phase === 'final_answering' && game.currentClue && (
          <div className="space-y-4">
            <ClueDisplay clue={game.currentClue} video={{ role: 'host', roomCode }} />
            <p className="text-center font-jeopardy text-2xl text-crt-amber-light">
              {Math.max(0, Math.ceil(((game.finalAnswerDeadline ?? now) - now) / 1000))}s
            </p>
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.uid} className={`flex justify-between p-3 ${card}`}>
                  <span>{p.displayName}</span>
                  <span className={answers[p.uid] ? 'text-crt-amber-light' : 'text-crt-cream/50'}>
                    {answers[p.uid] ? 'Answer locked in' : 'Waiting…'}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                const order = [...players].sort((a, b) => a.score - b.score).map((p) => p.uid)
                setFinalRevealOrder(roomCode, order)
              }}
              className={btnPrimary}
            >
              Reveal Wagers &amp; Answers
            </button>
          </div>
        )}

        {game.phase === 'final_reveal' && game.finalRevealOrder && (
          <FinalRevealStep
            roomCode={roomCode}
            game={game}
            players={players}
            wagers={wagers}
            answers={answers}
          />
        )}
      </div>
    </div>
  )
}

function FinalRevealStep({
  roomCode,
  game,
  players,
  wagers,
  answers,
}: {
  roomCode: string
  game: Game
  players: Player[]
  wagers: Record<string, { value: number }>
  answers: Record<string, { value: string }>
}) {
  const playerId = game.finalRevealOrder![game.finalRevealIndex]
  const player = players.find((p) => p.uid === playerId)
  const wager = wagers[playerId]
  const answer = answers[playerId]

  if (!player) return <p className="text-crt-cream/60">Loading…</p>

  return (
    <div className={`animate-clue-in p-8 text-center ${card}`}>
      <p className="mb-4 font-display text-2xl font-medium text-crt-amber-light">{player.displayName}</p>
      <p className="mb-2 text-crt-cream/80">
        Wager: <span className="text-crt-amber-light">${wager?.value ?? '…'}</span>
      </p>
      <p className="mb-6 text-crt-cream/80">
        Answer: {answer?.value || <em className="text-crt-cream/50">(no answer submitted)</em>}
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={() => judgeFinalPlayer(roomCode, playerId, true, wager?.value ?? 0)} className={btnCorrect}>
          Correct
        </button>
        <button
          onClick={() => judgeFinalPlayer(roomCode, playerId, false, wager?.value ?? 0)}
          className={btnIncorrect}
        >
          Incorrect
        </button>
      </div>
    </div>
  )
}
