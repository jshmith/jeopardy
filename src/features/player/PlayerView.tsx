import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { setLastRoom } from '../../lib/localRoom'
import { useGameDoc, usePlayers } from '../game/useGame'
import { BoardGrid } from '../../components/BoardGrid'
import { Scoreboard } from '../../components/Scoreboard'
import { ClueDisplay } from '../../components/ClueDisplay'
import { Spinner } from '../../components/Spinner'
import { btnPrimary, inputBase } from '../../lib/uiClasses'
import { useClockOffsetMs } from '../../lib/serverClock'
import { BuzzerButton } from '../buzzer/BuzzerButton'
import { DailyDoubleWagerPlayer } from './DailyDoubleWagerPlayer'
import { FinalJeopardyPlayer } from './FinalJeopardyPlayer'
import { PitchGamePlayer } from '../pitch/PitchGamePlayer'
import { submitHostChoiceAnswer } from './playerActions'

/** Host's-choice clue with text input enabled: type a guess, then wait for the host to award someone. */
function HostChoiceAnswerForm({
  roomCode,
  uid,
  submittedAnswer,
}: {
  roomCode: string
  uid: string
  submittedAnswer: string | undefined
}) {
  const [answer, setAnswer] = useState('')
  const [sent, setSent] = useState(false)

  if (submittedAnswer !== undefined || sent) {
    return <p className="animate-fade-in-up text-center text-crt-cream/60">Answer submitted — waiting on the host…</p>
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer"
        className={`w-full max-w-sm ${inputBase} text-center`}
      />
      <button
        onClick={async () => {
          setSent(true)
          await submitHostChoiceAnswer(roomCode, uid, answer)
        }}
        disabled={!answer.trim()}
        className={btnPrimary}
      >
        Submit answer
      </button>
    </div>
  )
}

function CenteredLoader({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 crt-page text-crt-cream/70">
      <Spinner /> {text}
    </div>
  )
}

export function PlayerView() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const uid = useAuthUid()
  const game = useGameDoc(roomCode)
  const players = usePlayers(roomCode)
  const clockOffsetMs = useClockOffsetMs(game?.updatedAt)

  useEffect(() => {
    if (roomCode) setLastRoom({ roomCode, role: 'player' })
  }, [roomCode])

  if (!roomCode || game === undefined || !uid) return <CenteredLoader text="Loading…" />
  if (game === null)
    return <div className="flex min-h-screen items-center justify-center crt-page text-crt-cream/70">Game not found.</div>

  const me = players.find((p) => p.uid === uid)
  if (players.length > 0 && !me) {
    return <Navigate to={`/join?code=${roomCode}`} replace />
  }
  if (!me) return <CenteredLoader text="Loading…" />

  if (game.round === 'final') {
    return (
      <div className="min-h-screen crt-page p-4 text-crt-cream md:p-6">
        <FinalJeopardyPlayer roomCode={roomCode} game={game} players={players} uid={uid} clockOffsetMs={clockOffsetMs} />
      </div>
    )
  }

  const boardMeta = game.boardMeta[game.round]
  const clue = game.currentClue
  const isDailyDoubleController =
    game.phase === 'daily_double_wager' &&
    game.dailyDouble?.controllingPlayerId === uid &&
    !game.dailyDouble.wagerSubmitted

  return (
    <div className="min-h-screen crt-page p-4 text-crt-cream md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <Scoreboard
            players={players}
            buzzWinnerId={game.buzz.winnerId}
            lockedOutPlayerIds={game.buzz.lockedOutPlayerIds}
            controlPlayerId={game.controlPlayerId}
            highlightUid={uid}
          />
        </div>

        {game.phase === 'pitch_game' && game.pitchGame ? (
          <PitchGamePlayer
            roomCode={roomCode}
            uid={uid}
            players={players}
            targetMidi={game.pitchGame.targetMidi}
          />
        ) : !clue ? (
          <>
            <p className="mb-3 text-center text-sm capitalize tracking-wide text-crt-cream/50">{game.round} Jeopardy</p>
            <BoardGrid categories={boardMeta} />
          </>
        ) : isDailyDoubleController ? (
          <DailyDoubleWagerPlayer roomCode={roomCode} round={game.round} myScore={me.score} />
        ) : game.phase === 'daily_double_wager' ? (
          <p className="animate-fade-in-up text-center text-crt-cream/70">Daily Double! Waiting on the wager…</p>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <ClueDisplay clue={clue} video={{ role: 'viewer', sync: game.videoSync ?? null, clockOffsetMs }} />
            {(game.phase === 'clue_revealed' || game.phase === 'buzzer_open') &&
              (clue.isDailyDouble ? (
                <p className="animate-fade-in-up text-center text-crt-cream/60">
                  {game.dailyDouble?.controllingPlayerId === uid
                    ? 'Answer out loud — no buzzer needed.'
                    : `Waiting for ${
                        players.find((p) => p.uid === game.dailyDouble?.controllingPlayerId)?.displayName ??
                        'the controlling player'
                      } to answer…`}
                </p>
              ) : clue.mode === 'host_control' ? (
                clue.allowTextInput ? (
                  <HostChoiceAnswerForm roomCode={roomCode} uid={uid} submittedAnswer={clue.textAnswers?.[uid]} />
                ) : (
                  <p className="animate-fade-in-up text-center text-crt-cream/60">
                    No buzzers on this one — the host picks who gets the money.
                  </p>
                )
              ) : (
                <BuzzerButton roomCode={roomCode} playerId={uid} buzz={game.buzz} clockOffsetMs={clockOffsetMs} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
